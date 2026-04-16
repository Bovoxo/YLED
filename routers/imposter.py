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
"škola": [
        ("Tělocvik", "Matematika"),      # Pohyb vs. sezení/počítání
        ("Tabule", "Školní lavice"),     # Píše se na ni vs. sedí se v ní
        ("Ředitelna", "Školní jídelna"), # Průšvih vs. jídlo
        ("Písemka", "Přestávka"),        # Stres vs. odpočinek
        ("Kružítko", "Přezůvky")         # Rýsování vs. chození
    ],
    "jídlo": [
        ("Špagety", "Polévka"),          # Namotává se vs. srká se lžící
        ("Palačinky", "Míchaná vajíčka"),# Sladké vs. slané
        ("Jablko", "Meloun"),            # Malé/strom vs. obrovské/země
        ("Čokoláda", "Brambůrky"),       # Sladké vs. slané/křupavé
        ("Párek v rohlíku", "Svíčková")  # Rychlovka do ruky vs. omáčka s knedlíkem
    ],
    "sport": [
        ("Lední hokej", "Krasobruslení"),# Drsné/tým vs. umělecké/jednotlivec
        ("Šachy", "Box"),                # Ticho/mozek vs. rvačka/ring
        ("Plavání", "Lyžování"),         # Voda/léto vs. sníh/zima
        ("Cyklistika", "Běh"),           # Stroj/kola vs. jen nohy
        ("Golf", "Basketbal")            # Klid/jamky vs. rychlost/koš
    ],
    "profese": [
        ("Zpěvák", "Moderátor zpráv"),   # Koncert/hudba vs. televize/vážnost
        ("Popelář", "Pošťák"),           # Odváží odpad vs. přiváží dopisy
        ("Chirurg", "Řezník"),           # Zachraňuje lidi vs. zpracovává maso (vtipný chyták)
        ("Automechanik", "Závodník F1"), # Opravuje vs. řídí
        ("Kuchař", "Číšník")             # Vaří vzadu vs. roznáší vepředu
    ],
    "zvířata": [
        ("Pes", "Kočka"),                # Štěká/hlídá vs. mňouká/škrábe
        ("Slon", "Žirafa"),              # Chobot/těžký vs. krk/vysoká
        ("Orel", "Tučňák"),              # Létá vysoko vs. plave/zima
        ("Žralok", "Kapr"),              # Nebezpečný/moře vs. Vánoce/rybník
        ("Hada", "Žába")                 # Plazí se vs. skáče
    ],
    "tábor": [
        ("Stan", "Hlavní budova"),       # Spaní venku vs. pevná stavba
        ("Táborák", "Stezka odvahy"),    # Oheň/zpěv vs. tma/strach
        ("Spacák", "Batoh"),             # Leze se do něj vs. nosí se na zádech
        ("Vedoucí", "Kuchařka"),         # Dělá program vs. dělá jídlo
        ("Baterka", "Repelent")          # Svítí ve tmě vs. stříká se proti komárům
    ]
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
