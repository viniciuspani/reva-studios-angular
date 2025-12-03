import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

export interface UploadResponse {
  success: boolean;
  fileKey: string;
  fileUrl: string;
  bucketName?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  bucketName: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  fileKey: string;
  bucketName: string;
}

export interface SimplePhoto {
  key: string;
  name: string;
  size: number;
  lastModified: string;
}

export interface ListPhotosResponse {
  success: boolean;
  folder: string;
  photos: SimplePhoto[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = 'https://hleasylvvb.execute-api.us-east-2.amazonaws.com/prod';
  
  constructor(private http: HttpClient) { }

  /**
   * Faz upload de um arquivo para o S3
   */
  uploadFile(file: File): Observable<UploadResponse> {
    console.log('Iniciando upload:', file.name);
    
    return this.http.post<PresignedUrlResponse>(
      `${this.apiUrl}/generate-upload-url`,
      {
        fileName: file.name,
        fileType: file.type
      }
    ).pipe(
      switchMap(response => {
        console.log('URL pré-assinada recebida:', response);
        
        return from(
          fetch(response.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          }).then(uploadResponse => {
            if (!uploadResponse.ok) {
              throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }
            console.log('Upload concluído com sucesso');
            
            return {
              success: true,
              fileKey: response.fileKey,
              fileUrl: this.getProxyImageUrl(response.fileKey),
              bucketName: response.bucketName
            };
          })
        );
      }),
      catchError(error => {
        console.error('Erro no upload:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Deleta um arquivo do S3
   */
  deleteFile(fileKey: string): Observable<DeleteResponse> {
    console.log('Deletando arquivo do S3:', fileKey);
    
    return this.http.delete<DeleteResponse>(
      `${this.apiUrl}/delete-image`,
      {
        params: { fileKey }
      }
    ).pipe(
      catchError(error => {
        console.error('Erro ao deletar arquivo:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtém URL do proxy de imagem
   */
  getProxyImageUrl(fileKey: string): string {
    return `${this.apiUrl}/proxy-image?fileKey=${encodeURIComponent(fileKey)}`;
  }

  /**
   * Obtém URL para visualização/download
   */
  getDownloadUrl(fileKey: string): Observable<string> {
    return of(this.getProxyImageUrl(fileKey));
  }

  /**
   * Faz upload e retorna a URL de visualização
   */
  uploadAndGetUrl(file: File): Observable<UploadResponse> {
    return this.uploadFile(file);
  }

  /**
   * Faz upload de múltiplos arquivos
   */
  uploadMultipleFiles(files: File[]): Observable<UploadResponse[]> {
    if (files.length === 0) {
      return of([]);
    }
    
    const uploads = files.map(file => this.uploadAndGetUrl(file));
    return forkJoin(uploads);
  }

  // ========== MÉTODOS PARA PASTAS FIXAS DO S3 ==========

  /**
   * Lista fotos de uma pasta fixa do S3
   */
  listFixedFolderPhotos(folderName: string): Observable<ListPhotosResponse> {
    console.log('Listando fotos da pasta fixa:', folderName);
    
    return this.http.get<ListPhotosResponse>(
      `${this.apiUrl}/list-photos`,
      {
        params: { folder: folderName }
      }
    ).pipe(
      catchError(error => {
        console.error('Erro ao listar fotos da pasta fixa:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lista fotos de "minhas-fotos"
   */
  getMinhasFotos(): Observable<ListPhotosResponse> {
    return this.listFixedFolderPhotos('minhas-fotos');
  }

  /**
   * Lista fotos de "minha-melhor-turma-de-ingles"
   */
  getTurmaIngles(): Observable<ListPhotosResponse> {
    return this.listFixedFolderPhotos('minha-melhor-turma-de-ingles');
  }

  /**
   * Verifica se uma pasta é uma pasta fixa do S3
   */
  isFixedFolder(folderId: string): boolean {
    return folderId === 'fixed-minhas-fotos' || folderId === 'fixed-turma-ingles';
  }

  /**
   * Obtém o nome da pasta no S3 baseado no ID
   */
  getFixedFolderName(folderId: string): string | null {
    switch (folderId) {
      case 'fixed-minhas-fotos':
        return 'minhas-fotos';
      case 'fixed-turma-ingles':
        return 'minha-melhor-turma-de-ingles';
      default:
        return null;
    }
  }
}