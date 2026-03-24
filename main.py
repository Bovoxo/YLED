from fastapi import FastAPI
from routers import random_number
from routers import team_splitter
from routers import lyrics_to_ppt
from routers import youtube_downloader  # <--- NOVÝ IMPORT
from fastapi.middleware.cors import CORSMiddleware

#ZAPNUTÍ COMMAND:
#uvicorn main:app --reload

app = FastAPI(title="🏕️ YLeventdeck API")

app.include_router(random_number.router)
app.include_router(team_splitter.router)
app.include_router(lyrics_to_ppt.router)
app.include_router(youtube_downloader.router)  # <--- NOVÉ ZAPOJENÍ
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
# Můžeme si tu nechat i jednoduchou úvodní stránku, abychom viděli, že server běží
@app.get("/")
def read_root():
    return {"zprava": "Vítej v API pro YLeventdeck! Běž na /docs pro testování."}
