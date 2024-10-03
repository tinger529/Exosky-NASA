# Exosky-NASA

## Set up for backend
1. Build frontend pkg
   ```bash
   npm run build
   ```
2. Move the `index.js`, `js/`, and `css/` from `build` to `backend/static`
   ```bash
   static/
   ├── js/ 
   ├── css/ 
   ├── index.js
   ```
3. Create an virtual environment in `backend/`
   ```bash
   python -m venv .venv

   # activate
   # In powershell
   ./.venv/Scripts/Activate.ps1
   # Or in unix
   source .venv/Scripts/activate

   # After activated, you should see (.venv) prefix in your shell.
   ```
4. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
5. Run the server!
   ```bash
   fastapi dev main.py
   ```

## File structure
```bash
Exosky-NASA/
├── backend/
│   ├── static/             # Static files directory
│   ├── main.py             # FastAPI entry point
├── frontend/
│   ├── build/
|   ├── public/
|   ├── src/
```