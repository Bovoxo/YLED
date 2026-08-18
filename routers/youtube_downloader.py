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
        # Absolutní cesta k FFmpeg v hlavní složce
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ffmpeg_cesta = os.path.join(BASE_DIR, "ffmpeg.exe")

        if not os.path.exists(ffmpeg_cesta):
            return {"chyba": f"Kritická chyba: FFmpeg nebyl nalezen na cestě: {ffmpeg_cesta}. Zkontroluj složku."}

        # Základní nastavení ZCELA BEZ MASKOVÁNÍ
        ydl_opts = {
            'outtmpl': f'{temp_dir}/%(title)s.%(ext)s',
            'ffmpeg_location': ffmpeg_cesta,
            'restrictfilenames': False,
            'windowsfilenames': True,
            'noplaylist': True,
            # Odstraněny parametry extractor_args a http_headers.
            # Necháváme yt-dlp použít vlastní integrované mechanismy.
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
        # Rozšířený záchyt specifických chyb
        if "The page needs to be reloaded" in chybova_zprava or "Sign in to confirm" in chybova_zprava:
            return {"chyba": "YouTube zablokoval požadavek (Ochrana proti botům). Je nutné aktualizovat yt-dlp na serveru."}
        elif "DRM protected" in chybova_zprava:
            return {"chyba": "Toto video má od YouTube uzamčenou (DRM) kvalitu. Zkus přepnout na 360p, nebo stáhnout jen Audio."}
        return {"chyba": chybova_zprava}