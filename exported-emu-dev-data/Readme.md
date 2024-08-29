# Firebase Emulator Persistence Data Folder

This folder contains the exported data for the Firebase emulators to ensure data persistence across emulator sessions. 

## Starting the Emulators with Persistent Data

To start the Firebase emulators with the persistent data contained in this folder, use the following command:

```bash
firebase emulators:start --import=exported-emu-dev-data --export-on-exit=exported-emu-dev-data
