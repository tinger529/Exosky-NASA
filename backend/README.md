# Exosky-NASA

> For easy implement, current use local python instead of virtual environment.

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
3. Get into `backend` and install dependencies
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server!
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