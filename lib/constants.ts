import type { SourceDefinition } from "./types";

export const ROOT_FOLDER_ID = "root";
export const REVIEW_FOLDER_ID = "review";

export const SOURCE_FOLDERS: SourceDefinition[] = [
  {
    id: "source-1",
    name: "Acervo de origem 1",
    folderId: process.env.GOOGLE_DRIVE_SOURCE_FOLDER_1 || "164JUiDoPsibeyF1c__lG1Qkyy1rwiRRI",
    url: "https://drive.google.com/drive/folders/164JUiDoPsibeyF1c__lG1Qkyy1rwiRRI",
    readOnly: true,
  },
  {
    id: "source-2",
    name: "Acervo de origem 2",
    folderId: process.env.GOOGLE_DRIVE_SOURCE_FOLDER_2 || "1Vf_SC7Gh5_DD2kzeHs_zM9vT0DTGzvfM",
    url: "https://drive.google.com/drive/folders/1Vf_SC7Gh5_DD2kzeHs_zM9vT0DTGzvfM",
    readOnly: true,
  },
];

export const DEFAULT_FOLDERS = [
  { id: ROOT_FOLDER_ID, name: "Murano Marketing", parentId: null, path: "MURANO_MARKETING", protected: true },
  { id: "inbox", name: "00 Entrada", parentId: ROOT_FOLDER_ID, path: "MURANO_MARKETING/00_ENTRADA", protected: true },
  { id: "campaigns", name: "01 Campanhas", parentId: ROOT_FOLDER_ID, path: "MURANO_MARKETING/01_CAMPANHAS", protected: true },
  { id: "evergreen", name: "02 Evergreen", parentId: ROOT_FOLDER_ID, path: "MURANO_MARKETING/02_EVERGREEN", protected: true },
  { id: "products", name: "Produtos", parentId: "evergreen", path: "MURANO_MARKETING/02_EVERGREEN/PRODUTOS" },
  { id: "lifestyle", name: "Lifestyle", parentId: "evergreen", path: "MURANO_MARKETING/02_EVERGREEN/LIFESTYLE" },
  { id: "ugc", name: "UGC", parentId: "evergreen", path: "MURANO_MARKETING/02_EVERGREEN/UGC" },
  { id: "institutional", name: "Institucional", parentId: "evergreen", path: "MURANO_MARKETING/02_EVERGREEN/INSTITUCIONAL" },
  { id: "raw", name: "03 Materiais brutos", parentId: ROOT_FOLDER_ID, path: "MURANO_MARKETING/03_MATERIAIS_BRUTOS", protected: true },
  { id: "exports", name: "04 Exportados", parentId: ROOT_FOLDER_ID, path: "MURANO_MARKETING/04_EXPORTADOS", protected: true },
  { id: REVIEW_FOLDER_ID, name: "90 A classificar", parentId: ROOT_FOLDER_ID, path: "MURANO_MARKETING/90_A_CLASSIFICAR", protected: true },
  { id: "archive", name: "99 Arquivo", parentId: ROOT_FOLDER_ID, path: "MURANO_MARKETING/99_ARQUIVO", protected: true },
] as const;
