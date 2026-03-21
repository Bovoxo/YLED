from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter()


# 1. Zde definujeme, co nám frontend (React) pošle.
# Nahrazuje to tvůj původní txt_input a slider_teams.
class TeamRequest(BaseModel):
    seznam_jmen: str  # Dlouhý text se jmény (oddělenými entrem)
    pocet_tymu: int = 2


# 2. Používáme .post místo .get
@router.post("/api/rozdelit-tymy")
def split_teams(request: TeamRequest):
    # 3. Získání jmen z textu (tvoje původní logika)
    raw_text = request.seznam_jmen
    # Rozdělíme text na řádky a odstraníme prázdné řádky a mezery
    names = [line.strip() for line in raw_text.splitlines() if line.strip()]

    if not names:
        return {"chyba": "Nebyly zadány žádné jména ke slosování."}

    if request.pocet_tymu < 1:
        return {"chyba": "Počet týmů musí být alespoň 1."}

    # 4. Zamíchání jmen
    random.shuffle(names)

    # 5. Příprava prázdných týmů
    num_teams = request.pocet_tymu
    teams = [[] for _ in range(num_teams)]

    # 6. Rozdávání (Logika "kdo dřív přijde" pomocí modula)
    for i, name in enumerate(names):
        team_index = i % num_teams
        teams[team_index].append(name)

    # 7. Výpis výsledku
    # Místo dlouhého nepřehledného textu vracíme hezkou strukturu dat (JSON),
    # ze které si budoucí React aplikace snadno poskládá kartičky týmů.
    vysledek = []
    for i, team in enumerate(teams):
        vysledek.append({
            "nazev_tymu": f"Tým {i + 1}",
            "pocet_clenu": len(team),
            "clenove": team
        })

    return {"vysledne_tymy": vysledek}