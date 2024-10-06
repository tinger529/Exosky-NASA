# Exosky-NASA

## Set up for backend
1. Create an virtual environment in `backend/`
   ```bash
   python -m venv .venv

   # activate
   # In powershell
   ./.venv/Scripts/Activate.ps1
   # Or in unix
   source .venv/Scripts/activate

   # After activated, you should see (.venv) prefix in your shell.
   ```
2. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
3. To execute test cases, add direcotry `image` as `backend/test/images`.
4. Run the server!
   - backend, in `backend/` directory
      ```bash
      fastapi dev main.py
      ```
   - frontend, in `frontend/` directory
      ```bash
      npm run start
      ```

   Access the website through `localhost:3000`.
   

## File structure
```bash
Exosky-NASA/
├── backend/
│   ├── static/             # Static files directory
│   ├── api/                # Main api and routers
│   ├── test/               # Test api and routers
│   ├── main.py             # FastAPI entry point
├── frontend/
│   ├── build/
|   ├── public/
|   ├── src/
```