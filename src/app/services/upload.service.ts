import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

export interface UploadResponse {
  success: boolean;
  fileKey: string;
  fileUrl: string;
  bucketName?: string;
  folder?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  bucketName: string;
  folder?: string;
}

export interface MultipleUploadRequest {
  files: Array<{
    fileName: string;
    fileType: string;
  }>;
  folder?: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    success: boolean;
    fileName: string;
    uploadUrl?: string;
    fileKey?: string;
    bucketName?: string;
    folder?: string;
    error?: string;
  }>;
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

  // ========== MÉTODOS DE UPLOAD ==========

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
   * Faz upload de múltiplos arquivos de uma vez (OTIMIZADO)
   */
  uploadMultipleFilesOptimized(files: File[], folder?: string): Observable<UploadResponse[]> {
    if (files.length === 0) {
      return of([]);
    }

    console.log(`Iniciando upload múltiplo de ${files.length} arquivos${folder ? ' para pasta: ' + folder : ''}`);

    // Monta array de metadados dos arquivos
    const filesMetadata = files.map(file => ({
      fileName: file.name,
      fileType: file.type
    }));

    const requestBody: MultipleUploadRequest = {
      files: filesMetadata,
      ...(folder && { folder })
    };

    // Faz UMA ÚNICA chamada para gerar todas as URLs pré-assinadas
    return this.http.post<MultipleUploadResponse>(
      `${this.apiUrl}/generate-upload-url`,
      requestBody
    ).pipe(
      switchMap(response => {
        console.log(`URLs geradas: ${response.successful} sucesso, ${response.failed} falhas`);

        // Filtra apenas os resultados bem-sucedidos
        const successfulResults = response.results.filter(r => r.success);

        if (successfulResults.length === 0) {
          throw new Error('Nenhuma URL pré-assinada foi gerada com sucesso');
        }

        // Faz upload de todos os arquivos em paralelo
        const uploadPromises = successfulResults.map((result) => {
          const file = files.find(f => f.name === result.fileName);
          
          if (!file || !result.uploadUrl) {
            return Promise.resolve({
              success: false,
              fileKey: result.fileKey || '',
              fileUrl: '',
              error: 'File or URL not found'
            } as UploadResponse);
          }

          return fetch(result.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          }).then(uploadResponse => {
            if (!uploadResponse.ok) {
              throw new Error(`Upload failed for ${file.name}: ${uploadResponse.statusText}`);
            }

            console.log(`Upload concluído: ${file.name}`);

            return {
              success: true,
              fileKey: result.fileKey!,
              fileUrl: this.getProxyImageUrl(result.fileKey!),
              bucketName: result.bucketName,
              folder: result.folder
            } as UploadResponse;
          }).catch(error => {
            console.error(`Erro ao fazer upload de ${file.name}:`, error);
            return {
              success: false,
              fileKey: result.fileKey || '',
              fileUrl: '',
              error: error.message
            } as UploadResponse;
          });
        });

        // Aguarda todos os uploads completarem
        return from(Promise.all(uploadPromises));
      }),
      catchError(error => {
        console.error('Erro no upload múltiplo:', error);
        const errorMessage = error.error?.message || error.message || 'Erro ao fazer upload múltiplo';
        return throwError(() => new Error(errorMessage));
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
   * Faz upload de múltiplos arquivos (usa método otimizado ou individual)
   */
  uploadMultipleFiles(files: File[], folder?: string): Observable<UploadResponse[]> {
    if (files.length === 0) {
      return of([]);
    }

    // Se for mais de 1 arquivo, usa o método otimizado
    if (files.length > 1) {
      return this.uploadMultipleFilesOptimized(files, folder);
    }

    // Se for apenas 1 arquivo, usa o método individual
    return this.uploadFile(files[0]).pipe(
      map(response => [response])
    );
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
    return folderId === 'fixed-minhas-fotos' || folderId === 'fixed-minha-melhor-turma-de-ingles';
  }

  /**
   * Obtém o nome da pasta no S3 baseado no ID
   */
  getFixedFolderName(folderId: string): string | null {
    switch (folderId) {
      case 'fixed-minhas-fotos':
        return 'minhas-fotos';
      case 'fixed-minha-melhor-turma-de-ingles':
        return 'minha-melhor-turma-de-ingles';
      default:
        return null;
    }
  }
}