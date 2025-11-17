/**
 * Interface para representar pastas no sistema de arquivos
 * Suporta hierarquia através do parentId
 */
export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}