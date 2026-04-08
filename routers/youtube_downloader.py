from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp
import os
from urllib.parse import quote

router = APIRouter()


# Šablona pro to, co pošleme z webu
class DownloadRequest(BaseModel):
    url: str
    mode: str  # "video" nebo "audio"
    kvalita: str = "1080"  # "1080" nebo "max" (jen pro video)


def smazat_soubor_po_odeslani(cesta: str):
    """Tato funkce se spustí potichu na pozadí a smaže soubor, aby neucpal server."""
    try:
        if os.path.exists(cesta):
            os.remove(cesta)
    except Exception as e:
        print(f"Chyba při mazání souboru: {e}")


@router.post("/stahnout-yt")
def download_youtube(req: DownloadRequest, background_tasks: BackgroundTasks):
    # Vytvoříme si složku pro dočasné uložení (pokud ještě neexistuje)
    temp_dir = "temp_downloads"
    os.makedirs(temp_dir, exist_ok=True)

    try:
        # Základní nastavení (vychází z tvého původního kódu)
        ydl_opts = {
            'outtmpl': f'{temp_dir}/%(title)s.%(ext)s',
            'ffmpeg_location': '/usr/bin/ffmpeg',
            'restrictfilenames': False,
            'windowsfilenames': True,
            'noplaylist': True,  # Stáhne jen jedno video, ne celý playlist
        }

        if req.mode == "audio":
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '320',
                }],
            })
        else:  # režim videa
            if req.kvalita == "max":
                format_str = 'bestvideo+bestaudio/best'
            else:
                format_str = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best'

            ydl_opts.update({
                'format': format_str,
                'merge_output_format': 'mp4',
                'postprocessor_args': {
                    'merger': ['-c:v', 'copy', '-c:a', 'aac'],
                },
            })

        # Samotné stahování
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(req.url, download=True)
            # yt-dlp změní koncovku (na mp4/mp3) až po stažení, takhle najdeme finální název
            cesta_k_souboru = ydl.prepare_filename(info_dict)

            if req.mode == "audio":
                cesta_k_souboru = cesta_k_souboru.rsplit('.', 1)[0] + '.mp3'
            elif req.mode == "video":
                cesta_k_souboru = cesta_k_souboru.rsplit('.', 1)[0] + '.mp4'

        if not os.path.exists(cesta_k_souboru):
            return {"chyba": "Konverze se nezdařila. Máš ve složce ffmpeg.exe?"}

        # Nařídíme serveru, aby soubor smazal ihned poté, co ho uživateli odešle
        background_tasks.add_task(smazat_soubor_po_odeslani, cesta_k_souboru)

        nazev_souboru = os.path.basename(cesta_k_souboru)
        bezpecny_nazev = quote(nazev_souboru)

        
        # Odeslání souboru prohlížeči
        return FileResponse(
            path=cesta_k_souboru,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{bezpecny_nazev}"}
        )

    except Exception as e:
        return {"chyba": str(e)}
