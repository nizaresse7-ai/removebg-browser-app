from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image
from rembg import remove

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / 'frontend'

app = FastAPI(title='Remove BG Browser App')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.mount('/assets', StaticFiles(directory=FRONTEND_DIR), name='assets')


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/api/remove')
async def api_remove(
    file: UploadFile = File(...),
    model: str = Form('u2net'),
    alpha_matting: str = Form('false'),
    alpha_matting_foreground_threshold: int = Form(240),
    alpha_matting_background_threshold: int = Form(10),
    alpha_matting_erode_size: int = Form(10),
):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail='Empty file')

        input_image = Image.open(BytesIO(data)).convert('RGBA')

        output = remove(
            input_image,
            model_name=model,
            alpha_matting=str(alpha_matting).lower() == 'true',
            alpha_matting_foreground_threshold=int(alpha_matting_foreground_threshold),
            alpha_matting_background_threshold=int(alpha_matting_background_threshold),
            alpha_matting_erode_size=int(alpha_matting_erode_size),
        )

        if isinstance(output, Image.Image):
            out = BytesIO()
            output.save(out, format='PNG')
            return Response(content=out.getvalue(), media_type='image/png')

        return Response(content=output, media_type='image/png')
    except HTTPException:
        raise
    except Exception as exc:
        return JSONResponse(status_code=500, content={'error': str(exc)})


@app.get('/')
def root():
    return FileResponse(FRONTEND_DIR / 'index.html')


@app.get('/{path:path}')
def spa_fallback(path: str):
    target = FRONTEND_DIR / path
    if target.exists() and target.is_file():
        return FileResponse(target)
    return FileResponse(FRONTEND_DIR / 'index.html')
