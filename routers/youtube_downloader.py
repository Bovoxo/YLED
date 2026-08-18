from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp
import os
import glob
import uuid
from urllib.parse import quote

router = APIRouter()


class DownloadRequest(BaseModel):
    url: str
    mode: str                  # "video" nebo "audio"
    kvalita: str = "1080"      # "nejnizsi", "1080", "max"


TEMP_DIR = "temp_downloads"


def smazat_soubor_po_odeslani(cesta: str):
    try:
        if os.path.exists(cesta):
            os.remove(cesta)
    except Exception as e:
        print(f"Chyba při mazání souboru: {e}")


@router.post("/stahnout-yt")
def download_youtube(
    req: DownloadRequest,
    background_tasks: BackgroundTasks
):
    os.makedirs(TEMP_DIR, exist_ok=True)

    # Základní kontrola vstupu
    if req.mode not in ("video", "audio"):
        raise HTTPException(
            status_code=400,
            detail="Neplatný režim stahování."
        )

    if req.kvalita not in ("nejnizsi", "1080", "max"):
        raise HTTPException(
            status_code=400,
            detail="Neplatná kvalita."
        )

    # Unikátní ID zabrání kolizím, pokud dva lidé stahují
    # video se stejným názvem.
    download_id = uuid.uuid4().hex

    output_template = os.path.join(
        TEMP_DIR,
        f"{download_id}_%(title).200s.%(ext)s"
    )

    ydl_opts = {
        "outtmpl": output_template,

        # Jen jedno video
        "noplaylist": True,

        # Bez zbytečných hlášek
        "quiet": True,
        "no_warnings": False,

        # Bezpečnější názvy souborů
        "restrictfilenames": True,

        # FFmpeg
        "ffmpeg_location": "/usr/bin/ffmpeg",

        # Pokud YouTube vrátí problém, chceme skutečnou chybu
        "ignoreerrors": False,
    }

    if req.mode == "audio":

        ydl_opts.update({
            "format": "bestaudio/best",

            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "320",
                }
            ],
        })

    else:
        # -----------------------------------------
        # VIDEO
        # -----------------------------------------

        if req.kvalita == "nejnizsi":
            # Maximálně 360p
            format_str = (
                "bestvideo[height<=360]+bestaudio/"
                "best[height<=360]/"
                "best"
            )

        elif req.kvalita == "1080":
            # Nejlepší video do 1080p + nejlepší audio
            format_str = (
                "bestvideo[height<=1080]+bestaudio/"
                "best[height<=1080]/"
                "best"
            )

        else:
            # MAX:
            # nejlepší dostupné video + nejlepší audio.
            #
            # Preferujeme MP4/H264, pokud existuje.
            # Pokud ne, dovolíme VP9/AV1.
            format_str = (
                "bestvideo+bestaudio/"
                "best"
            )

        ydl_opts.update({
            "format": format_str,

            # Výstupní kontejner.
            #
            # MKV je pro MAX nejbezpečnější, protože může obsahovat
            # H264, VP9 i AV1 bez nutnosti překódování.
            "merge_output_format": "mkv",
        })

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(req.url, download=True)

            if not info:
                raise Exception("Nepodařilo se získat informace o videu.")

            # Najdeme skutečně vytvořený soubor.
            #
            # prepare_filename() může vrátit původní příponu,
            # takže místo hádání finálního názvu projdeme temp složku.
            pattern = os.path.join(
                TEMP_DIR,
                f"{download_id}_*"
            )

            nalezene_soubory = glob.glob(pattern)

            if not nalezene_soubory:
                raise Exception(
                    "Stahování proběhlo, ale výsledný soubor nebyl nalezen."
                )

            # Vezmeme nejnovější soubor
            cesta_k_souboru = max(
                nalezene_soubory,
                key=os.path.getmtime
            )

        if not os.path.isfile(cesta_k_souboru):
            raise Exception(
                "Výsledný soubor neexistuje."
            )

        nazev_souboru = os.path.basename(cesta_k_souboru)

        # Odstraníme UUID z názvu, aby ho uživatel neviděl
        prefix = f"{download_id}_"
        if nazev_souboru.startswith(prefix):
            nazev_souboru = nazev_souboru[len(prefix):]

        bezpecny_nazev = quote(nazev_souboru)

        # Soubor smažeme po odeslání
        background_tasks.add_task(
            smazat_soubor_po_odeslani,
            cesta_k_souboru
        )

        return FileResponse(
            path=cesta_k_souboru,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition":
                    f"attachment; filename*=UTF-8''{bezpecny_nazev}"
            }
        )

    except yt_dlp.utils.DownloadError as e:
        print(f"yt-dlp chyba: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"YouTube/yt-dlp chyba: {str(e)}"
        )

    except Exception as e:
        print(f"Chyba při stahování: {e}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )