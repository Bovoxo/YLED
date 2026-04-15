from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter()

# Definice toho, co nám pošle frontend
class ImposterRequest(BaseModel):
    pocet_hracu: int
    pocet_imposteru: int
    kategorie: str
    zobrazit_napovedu: bool = False
    tajny_mod: bool = False # Mód, kde impostor dostane jen jiné slovo

# Jednoduchá databáze slov (můžeš si libovolně rozšířit)
DATABAZE_SLOV = {
    "škola": [("Učitel", "Ředitel"), ("Tabule", "Křída"), ("Přestávka", "Zvonění"), ("Písemka", "Zkouška")],
    "jídlo": [("Pizza", "Langoš"), ("Hamburger", "Párek v rohlíku"), ("Zmrzlina", "Ledová tříšť")],
    "sport": [("Fotbal", "Futsal"), ("Tenis", "Badminton"), ("Běh", "Chůze"), ("Plavání", "Potápění")],
    "profese": [("Policista", "Hasič"), ("Doktor", "Zubař"), ("Programátor", "Hacker"), ("Kuchař", "Číšník")]
}

@router.post("/api/imposter-losovat")
def losovat_role(req: ImposterRequest):
    if req.pocet_hracu <= req.pocet_imposteru:
        return {"chyba": "Počet hráčů musí být větší než počet impostorů!"}
    
    if req.kategorie not in DATABAZE_SLOV:
        return {"chyba": "Neznámá kategorie."}

    # Vybereme náhodnou dvojici slov z kategorie (hlavní slovo a alternativní pro tajný mód)
    dvojice = random.choice(DATABAZE_SLOV[req.kategorie])
    slovo_civilisty = dvojice[0]
    slovo_impostora = dvojice[1]

    role = []
    
    # Přidáme civilisty
    for _ in range(req.pocet_hracu - req.pocet_imposteru):
        role.append({"role": "Civilista", "slovo": slovo_civilisty})
        
    # Přidáme impostory
    for _ in range(req.pocet_imposteru):
        if req.tajny_mod:
            # Impostor neví, že je impostor, dostane jen podobné slovo
            role.append({"role": "Civilista?", "slovo": slovo_impostora})
        else:
            # Klasický mód - ví, že je impostor
            text = "JSI IMPOSTOR!"
            if req.zobrazit_napovedu:
                text += f" (Nápověda: {req.kategorie})"
            role.append({"role": "Impostor", "slovo": text})

    # Zamícháme pořadí hráčů
    random.shuffle(role)

    # Vytvoříme seznam pro frontend, aby hráči mohli klikat postupně
    vysledek = [{"hrac": i + 1, "data": data} for i, data in enumerate(role)]

    return {"hraci": vysledek}
