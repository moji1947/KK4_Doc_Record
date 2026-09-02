# วางไฟล์ Excel จริงที่นี่

1. `20260825 - Cement Plant 2_Conzol_Project_SetUp_Satellite Burner.xlsx`
2. `Document_Register_MasterData_Rebuilt.xlsx`
3. `Record_data_for_User_KK4-ME_-_CE_-_EE.xlsx`

หลังวางไฟล์แล้ว แก้ `../seed.ts` ให้อ่านจากไฟล์เหล่านี้แทน placeholder data
(แนะนำ `npm install xlsx --save-dev` แล้วใช้ `XLSX.readFile()` อ่านแต่ละชีตตาม mapping
ใน `../../../docs/skills/02-data-model.md`)
