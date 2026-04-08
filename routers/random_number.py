from fastapi import APIRouter
import random

# Místo 'app = FastAPI()' použijeme 'router = APIRouter()'
router = APIRouter()


# Tady se změnilo jen to slovíčko @app na @router
@router.get("/losovat")
def draw_number(od: int = 1, do: int = 100):
    if od > do:
        return {"chyba": "Chyba! Hodnota 'od' nesmí být větší než 'do'."}

    result = random.randint(od, do)
    return {
        "vylosovano": result,
        "rozsah": f"{od} - {do}"
    }
