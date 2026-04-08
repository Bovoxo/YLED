from fastapi import FastAPI
from routers import random_number
from routers import team_splitter
from routers import lyrics_to_ppt
from routers import youtube_downloader  # <--- NOVÝ IMPORT
from fastapi.middleware.cors import CORSMiddleware

#ZAPNUTÍ COMMAND:
#uvicorn main:app --reload

app = FastAPI(title="🏕️ YLeventdeck API", root_path="/api")


app.include_router(random_number.router)
app.include_router(team_splitter.router)
app.include_router(lyrics_to_ppt.router)
app.include_router(youtube_downloader.router)  # <--- NOVÉ ZAPOJENÍ

# TADY JE TEN NOVÝ SEZNAM ADRES:
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://81.2.236.30",
    "https://yleventdeck.cloud",
    "https://www.yleventdeck.cloud"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # <--- Tady jsme nahradili tu hvězdičku
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Můžeme si tu nechat i jednoduchou úvodní stránku, abychom viděli, že server běží
@app.get("/")
def read_root():
    return {"zprava": "Vítej v API pro YLeventdeck! Běž na /docs pro testování."}
