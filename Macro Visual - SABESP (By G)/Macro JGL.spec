# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    # <-- ADICIONAR: Altere para o caminho absoluto da pasta do seu projeto
    pathex=['C:/Users/gpereira.eficien/Desktop/Macro-Sabesp(Desenvlvimento)/Macro Visual - SABESP (By G)'],
    binaries=[],
    datas=[
        ('web', 'web'), 
        ('msedgedriver.exe', '.')
    ],
    hiddenimports=[
        # <-- RECOMENDADO: Adicione estes para garantir que as libs funcionem
        'pymysql.cursors',
        'eel.chrome',
        'bottle_websocket',
        'psutil',
        'tkinter'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'conda', 'conda-build', 'conda-verify', 'cytoolz', 'dask', 'distributed',
        'ipykernel', 'IPython', 'ipython_genutils', 'ipywidgets', 'jupyter',
        'jupyter_client', 'jupyter_core', 'jupyter_server', 'jupyterlab',
        'jupyterlab_server', 'matplotlib', 'matplotlib-inline', 'nbclient',
        'nbconvert', 'nbformat', 'notebook', 'numba', 'PyQt5', 'PySide2',
        'scipy', 'seaborn', 'statsmodels', 'tensorboard', 'tensorflow',
        'torch', 'torchvision', 'pytest', '_pytest', 'sphinx', 'astropy', 'networkx', 'sympy', 'mpmath',
        'pywt', 'skimage', 'numpydoc', 'pydoc', 'setuptools', 'wheel', 'pip',
        'plotly', 'cffi', 'pycparser', 'pygments'
    ],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    # [], # <-- MUDANÇA: Deixe o PyInstaller gerenciar os scripts aqui
    a.binaries, # <-- MUDANÇA: Inclua os binários que o Analysis encontrar
    a.datas, # <-- MUDANÇA: Inclua as datas que o Analysis encontrar
    # exclude_binaries=True, # <-- REMOVER: Esta linha é perigosa, pode excluir DLLs necessárias
    name='Macro JGL',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    # <-- IMPORTANTE PARA DEBUG: Mude para True para ver erros em um console
    console=False, 
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # <-- CORRIGIDO: Use barras duplas ou normais para evitar problemas com o caminho
    icon='web/imagens/SabespIcon.ico',
)

# A seção COLLECT não é mais necessária se você definir tudo dentro de EXE
# coll = COLLECT( ... )