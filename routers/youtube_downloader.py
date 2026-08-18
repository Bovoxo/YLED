from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp
import os
from urllib.parse import quote

router = APIRouter()


class DownloadRequest(BaseModel):
    url: str
    mode: str
    kvalita: str = "1080"  # Očekává "nejnizsi", "1080", "max"


def smazat_soubor_po_odeslani(cesta: str):
    try:
        if os.path.exists(cesta):
            os.remove(cesta)
    except Exception as e:
        print(f"Chyba při mazání souboru: {e}")


@router.post("/stahnout-yt")
def download_youtube(req: DownloadRequest, background_tasks: BackgroundTasks):
    temp_dir = "temp_downloads"
    os.makedirs(temp_dir, exist_ok=True)

    try:
        # 1. NEJBEZPEČNĚJŠÍ CESTA K FFMPEG
        # Tento kód zjistí, kde je tento soubor (ve složce routers), skočí o patro výš
        # do hlavní složky a tam ukáže přesně na ffmpeg.exe
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ffmpeg_cesta = os.path.join(BASE_DIR, "ffmpeg.exe")

        # Okamžitá kontrola - pokud ffmpeg.exe chybí nebo je cesta špatná, vyhodíme chybu na web!
        if not os.path.exists(ffmpeg_cesta):
            return {"chyba": f"Kritická chyba: FFmpeg nebyl nalezen na cestě: {ffmpeg_cesta}. Zkontroluj složku."}

        # 2. Základní nastavení
        ydl_opts = {
            'outtmpl': f'{temp_dir}/%(title)s.%(ext)s',
            'ffmpeg_location': ffmpeg_cesta,
            'restrictfilenames': False,
            'windowsfilenames': True,
            'noplaylist': True,
            'extractor_args': {
                'youtube': {
                    # Kombinace pro nejlepší kvalitu a obcházení limitů bez spouštění DRM blokací
                    'player_client': ['tv', 'web']
                }
            },
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
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
        else:
            # 3. TVRDÉ VYNUCENÍ KVALITY
            # Zde definujeme striktní formáty bez kompromisů a povolíme fúzi v mp4
            if req.kvalita == "max":
                format_str = 'bestvideo+bestaudio/best'
            elif req.kvalita == "nejnizsi":
                format_str = 'bestvideo[height<=360]+bestaudio/best'
            else:
                format_str = 'bestvideo[height<=1080]+bestaudio/best'

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
            cesta_k_souboru = ydl.prepare_filename(info_dict)

            if req.mode == "audio":
                cesta_k_souboru = cesta_k_souboru.rsplit('.', 1)[0] + '.mp3'
            elif req.mode == "video":
                cesta_k_souboru = cesta_k_souboru.rsplit('.', 1)[0] + '.mp4'

        if not os.path.exists(cesta_k_souboru):
            return {"chyba": "Soubor se nestáhl nebo se spojení audia s videem nezdařilo."}

        # Smazání souboru po odeslání
        background_tasks.add_task(smazat_soubor_po_odeslani, cesta_k_souboru)
        bezpecny_nazev = quote(os.path.basename(cesta_k_souboru))

        return FileResponse(
            path=cesta_k_souboru,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{bezpecny_nazev}"}
        )

    except Exception as e:
        chybova_zprava = str(e)
        if "DRM protected" in chybova_zprava:
            return {
                "chyba": "Toto video má od YouTube uzamčenou (DRM) kvalitu. Zkus přepnout na 360p, nebo stáhnout jen Audio."}
        return {"chyba": chybova_zprava}