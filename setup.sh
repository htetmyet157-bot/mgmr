#!/bin/bash

# -------------------------------
# 1️⃣ Initialize Git if not already
# -------------------------------
if [ ! -d ".git" ]; then
  git init
  echo "Git repo initialized."
else
  echo "Git repo already exists."
fi

# -------------------------------
# 2️⃣ Initialize npm if package.json doesn't exist
# -------------------------------
if [ ! -f "package.json" ]; then
  npm init -y
  echo "package.json created."
else
  echo "package.json already exists."
fi

# -------------------------------
# 3️⃣ Install backend dependencies
# -------------------------------
npm install express express-session body-parser cors cookie-parser axios multer mammoth pdf-parse

# -------------------------------
# 4️⃣ Install development tools
# -------------------------------
npm install --save-dev nodemon eslint

# -------------------------------
# 5️⃣ Update package.json scripts
# -------------------------------
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.scripts = pkg.scripts || {};
pkg.scripts.start = 'node backend/server.js';
pkg.scripts.dev = 'nodemon backend/server.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Scripts added to package.json');
"

# -------------------------------
# 6️⃣ Create .gitignore
# -------------------------------
cat > .gitignore <<EOL
node_modules/
.env
uploads/
*.log
.DS_Store
EOL

echo ".gitignore created."

# -------------------------------
# 7️⃣ Final message
# -------------------------------
echo "✅ Setup complete!"
echo "Run 'npm run start' for normal server, or 'npm run dev' for auto-restart server."
echo "Your Git repo and .gitignore are ready."