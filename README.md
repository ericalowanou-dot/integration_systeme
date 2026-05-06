# QCM interactif (images)

Petite appli web **React + Vite**, sans serveur : quiz à choix multiples (A, B, C, D) avec une image par question, barre de progression, score et aide « bonne réponse » masquable.

## Prérequis sur la machine de ton ami

- **Node.js** (version **18** ou plus récente recommandée) : [https://nodejs.org](https://nodejs.org)  
  L’installation inclut en général **npm**.

Pour vérifier dans un terminal :

```bash
node -v
npm -v
```

## Installation

1. Copier tout le dossier du projet (zip, clé USB, etc.) sur sa machine.
2. Ouvrir un terminal **dans ce dossier** (là où se trouvent `package.json` et `README.md`).
3. Installer les dépendances :

```bash
npm install
```

## Lancer l’application en local

```bash
npm run dev
```

Le terminal affiche une adresse du type **http://localhost:5173**. Ouvrir ce lien dans Chrome, Firefox ou Edge.

Pour arrêter le serveur : `Ctrl + C` dans le terminal.

## Build pour production (optionnel)

Génère un site statique dans le dossier `dist/` :

```bash
npm run build
```

Pour tester le résultat en local :

```bash
npm run preview
```

## Fichiers importants

| Élément | Rôle |
|--------|------|
| `public/qcm/1.jpg` … `168.jpg` | Images des questions (sans elles, un message d’erreur s’affiche). |
| `answers.json` | Bonnes réponses au format `{"1":"A","2":"B",...}` (lettres A, B, C ou D). |

Si des images manquent, vérifie que les fichiers sont bien nommés **`1.jpg`**, **`2.jpg`**, etc., et placés dans **`public/qcm/`**.

## Windows (PowerShell ou CMD)

Les mêmes commandes fonctionnent après `cd` vers le dossier du projet, par exemple :

```powershell
cd C:\chemin\vers\inte_sys
npm install
npm run dev
```

## Dépannage rapide

- **Port déjà utilisé** : Vite propose parfois un autre port dans le terminal (`localhost:5174`, etc.) — suivre l’URL affichée.
- **Modifications de `answers.json` sans effet** : recharger la page (éventuellement un rechargement forcé : `Ctrl + F5`).
- **Erreur à `npm install`** : vérifier la version de Node (`node -v`) et relancer le terminal en administrateur si un antivirus bloque les fichiers.
