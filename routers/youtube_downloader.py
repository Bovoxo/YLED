from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp
import os
import uuid
import threading
from urllib.parse import quote

router = APIRouter()

# Zde budeme ukládat stavy stahování do paměti
# Formát: {"task_id": {"procenta": 45.5, "status": "stahuje_se", "cesta": None, "chyba": None}}
STAVY_STAHOVANI = {}


class DownloadRequest(BaseModel):
    url: str
    mode: str
    kvalita: str = "1080"


def smazat_soubor_po_odeslani(cesta: str):
    """Smaže soubor po odeslání uživateli."""
    try:
        if os.path.exists(cesta):
            os.remove(cesta)
    except Exception as e:
        print(f"Chyba při mazání souboru: {e}")


def progress_hook(d, task_id):
    """Tuto funkci volá yt-dlp při každé změně procent stahování."""
    if d['status'] == 'downloading':
        # Vytažení čistého čísla ze stringu (např. z " 45.5%")
        percent_str = d.get('_percent_str', '0%').strip('\x1b[0;94m').strip('\x1b[0m').replace('%', '')
        try:
            STAVY_STAHOVANI[task_id]["procenta"] = float(percent_str)
        except:
            pass
    elif d['status'] == 'finished':
        # Staženo, yt-dlp teď začne spojovat obraz a zvuk přes ffmpeg
        STAVY_STAHOVANI[task_id]["status"] = "konverze"


def stahnout_na_pozadi(req: DownloadRequest, task_id: str):
    """Hlavní stahovací proces, který běží bokem."""
    temp_dir = "temp_downloads"
    os.makedirs(temp_dir, exist_ok=True)

    try:
        ydl_opts = {
            'outtmpl': f'{temp_dir}/%(title)s.%(ext)s',
            # POZNÁMKA: V původním kódu máš '/usr/bin/ffmpeg', ale podle fotky máš ffmpeg.exe ve složce.
            # Pokud jsi na Windows, změň to třeba jen na 'ffmpeg.exe' nebo absolutní cestu.
            'ffmpeg_location': '/usr/bin/ffmpeg',
            'restrictfilenames': False,
            'windowsfilenames': True,
            'noplaylist': True,
            'progress_hooks': [lambda d: progress_hook(d, task_id)],  # Napojení našeho sledovače
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
                'postprocessor_args': {'merger': ['-c:v', 'copy', '-c:a', 'aac']},
            })

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(req.url, download=True)
            cesta_k_souboru = ydl.prepare_filename(info_dict)

            if req.mode == "audio":
                cesta_k_souboru = cesta_k_souboru.rsplit('.', 1)[0] + '.mp3'
            elif req.mode == "video":
                cesta_k_souboru = cesta_k_souboru.rsplit('.', 1)[0] + '.mp4'

        if not os.path.exists(cesta_k_souboru):
            STAVY_STAHOVANI[task_id] = {"status": "chyba", "chyba": "Konverze se nezdařila. Máš ffmpeg?"}
            return

        STAVY_STAHOVANI[task_id] = {"status": "hotovo", "cesta": cesta_k_souboru, "procenta": 100}

    except Exception as e:
        STAVY_STAHOVANI[task_id] = {"status": "chyba", "chyba": str(e)}


# KROK 1: Frontend zavolá tuto routu, ta okamžitě odpoví a začne stahovat
@router.post("/stahnout-yt-start")
def start_download(req: DownloadRequest):
    task_id = str(uuid.uuid4())
    STAVY_STAHOVANI[task_id] = {"status": "stahuje_se", "procenta": 0, "cesta": None, "chyba": None}

    thread = threading.Thread(target=stahnout_na_pozadi, args=(req, task_id))
    thread.start()

    return {"task_id": task_id}


# KROK 2: Frontend se sem ptá na procenta
@router.get("/stahnout-yt-stav/{task_id}")
def check_status(task_id: str):
    if task_id not in STAVY_STAHOVANI:
        return {"status": "nenalezeno"}
    return STAVY_STAHOVANI[task_id]


# KROK 3: Vyzvednutí hotového souboru
@router.get("/stahnout-yt-soubor/{task_id}")
def get_file(task_id: str, background_tasks: BackgroundTasks):
    stav = STAVY_STAHOVANI.get(task_id)
    if not stav or stav["status"] != "hotovo":
        return {"chyba": "Soubor ještě není připraven"}

    cesta = stav["cesta"]
    nazev_souboru = os.path.basename(cesta)
    bezpecny_nazev = quote(nazev_souboru)

    del STAVY_STAHOVANI[task_id]  # Vyčistíme paměť
    background_tasks.add_task(smazat_soubor_po_odeslani, cesta)

    return FileResponse(
        path=cesta,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{bezpecny_nazev}"}
    )