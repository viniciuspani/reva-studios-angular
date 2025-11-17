/**
 * Interface para representar fotos armazenadas
 * Contém metadados e dados da imagem em base64
 */
export interface Photo {
  id: string;
  userId: string;
  folderId: string | null;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl: string;
}