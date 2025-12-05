import { Component, inject, OnInit, signal, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CustomTreeComponent, TreeNode } from '../../components/custom-tree/custom-tree.component';
import { StorageService } from '../../services/storage.service';
import { LanguageService } from '../../services/language.service';
import { UploadService, UploadResponse } from '../../services/upload.service';
import { User } from '../../models/user.model';
import { Photo } from '../../models/photo.model';
import { Folder } from '../../models/folder.model';
import { forkJoin } from 'rxjs';

/**
 * Interface estendida para fotos com URL de visualização
 */
interface PhotoWithUrl extends Photo {
  displayUrl?: string;
  isLoadingUrl?: boolean;
}

/**
 * Componente do dashboard do usuário
 * Gerencia upload, visualização e organização de fotos em pastas
 */
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    FileUploadModule,
    ToastModule,
    MenuModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
    NavbarComponent,
    CustomTreeComponent
  ],
  providers: [MessageService],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserDashboardComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private messageService = inject(MessageService);
  private uploadService = inject(UploadService);
  public languageService = inject(LanguageService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Signals para controle de estado
  currentUser = signal<User | null>(null);
  photos = signal<PhotoWithUrl[]>([]);
  folders = signal<Folder[]>([]);
  selectedFolderId = signal<string | null>(null);
  isUploading = signal(false);
  isLoadingPhotos = signal(false);
  selectedFile = signal<{ name: string; path: string } | null>(null);
  totalFixedPhotosCount = signal<number>(0);

  // Controle de modais
  showCreateDialog = false;
  showEditDialog = false;
  showDeleteDialog = false;
  createFolderName = '';
  newFolderName = '';
  parentFolderForCreate = signal<Folder | null>(null);
  folderToEdit = signal<Folder | null>(null);
  folderToDelete = signal<Folder | null>(null);

  ngOnInit(): void {
    // Verifica autenticação
    const user = this.storageService.getCurrentUser();
    if (!user || user.role !== 'user') {
      this.router.navigate(['/auth']);
      return;
    }
    this.currentUser.set(user);
    this.loadData();
    this.loadFixedPhotosCount();
  }

  /**
   * Carrega dados de pastas e fotos
   */
  loadData(): void {
    const user = this.currentUser();
    if (!user) return;

    const userFolders = this.storageService.getUserFolders(user.id);
    this.folders.set(userFolders);
    this.loadPhotos();
  }

  /**
   * Carrega fotos da pasta selecionada
   * Detecta se é pasta fixa do S3 ou pasta dinâmica do localStorage
   */
  loadPhotos(): void {
    const user = this.currentUser();
    if (!user) return;

    this.isLoadingPhotos.set(true);
    const selectedId = this.selectedFolderId();

    // Verifica se é uma pasta fixa do S3
    if (selectedId && this.isFixedFolder(selectedId)) {
      this.loadFixedFolderPhotos(selectedId);
    } else {
      // Pasta dinâmica ou raiz - carrega do localStorage
      this.loadDynamicFolderPhotos(selectedId);
    }
  }

  /**
   * Verifica se o ID é de uma pasta fixa
   */
  private isFixedFolder(id: string): boolean {
    return id === 'fixed-minhas-fotos' || id === 'fixed-minha-melhor-turma-de-ingles';
  }

  /**
   * Carrega fotos de pasta fixa do S3
   */
  private loadFixedFolderPhotos(folderId: string): void {
    const folderName = this.getFixedFolderName(folderId);
    
    if (!folderName) {
      this.isLoadingPhotos.set(false);
      return;
    }

    this.uploadService.listFixedFolderPhotos(folderName).subscribe({
      next: (response) => {
        console.log('Fotos da pasta fixa carregadas:', response);
        
        // Converte para PhotoWithUrl
        const photosWithUrl: PhotoWithUrl[] = response.photos.map(s3Photo => ({
          id: s3Photo.key,
          userId: this.currentUser()!.id,
          folderId: folderId,
          name: s3Photo.name,
          size: s3Photo.size,
          type: 'image/jpeg',
          uploadedAt: s3Photo.lastModified,
          dataUrl: '',
          s3Key: s3Photo.key,
          bucketName: 'reva-studios-uploads',
          displayUrl: this.uploadService.getProxyImageUrl(s3Photo.key),
          isLoadingUrl: false
        }));

        this.photos.set(photosWithUrl);
        this.isLoadingPhotos.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar fotos da pasta fixa:', error);
        this.showError('Erro', 'Falha ao carregar fotos da pasta fixa');
        this.photos.set([]);
        this.isLoadingPhotos.set(false);
      }
    });
  }

  /**
   * Obtém o nome da pasta no S3 baseado no ID
   */
  private getFixedFolderName(folderId: string): string | null {
    switch (folderId) {
      case 'fixed-minhas-fotos':
        return 'minhas-fotos';
      case 'fixed-minha-melhor-turma-de-ingles':
        return 'minha-melhor-turma-de-ingles';
      default:
        return null;
    }
  }

  /**
   * Carrega fotos de pasta dinâmica do localStorage
   * OTIMIZADO: Usa proxy-image diretamente (sem chamadas HTTP extras)
   */
  private loadDynamicFolderPhotos(folderId: string | null): void {
    const user = this.currentUser();
    if (!user) return;

    const userPhotos = this.storageService.getUserPhotos(user.id, folderId);

    // OTIMIZAÇÃO: Usa proxy-image diretamente (mesma lógica das pastas fixas)
    const photosWithUrl: PhotoWithUrl[] = userPhotos.map(photo => ({
      ...photo,
      displayUrl: photo.s3Key ? this.uploadService.getProxyImageUrl(photo.s3Key) : undefined,
      isLoadingUrl: false
    }));

    this.photos.set(photosWithUrl);
    this.isLoadingPhotos.set(false);
  }

  /**
   * Carrega contagem de fotos das pastas fixas do S3
   */
  private loadFixedPhotosCount(): void {
    // Faz requisições paralelas para ambas as pastas fixas
    forkJoin({
      minhasFotos: this.uploadService.listFixedFolderPhotos('minhas-fotos'),
      turmaIngles: this.uploadService.listFixedFolderPhotos('minha-melhor-turma-de-ingles')
    }).subscribe({
      next: (results) => {
        const total = results.minhasFotos.count + results.turmaIngles.count;
        this.totalFixedPhotosCount.set(total);
        console.log(`Total de fotos nas pastas fixas: ${total}`);
      },
      error: (error) => {
        console.error('Erro ao carregar contagem de fotos fixas:', error);
        // Em caso de erro, mantém o contador em 0
        this.totalFixedPhotosCount.set(0);
      }
    });
  }

  /**
   * Constrói nós raiz da árvore incluindo pastas fixas
   */
  getRootTreeNodes(): TreeNode[] {
    const user = this.currentUser();
    if (!user) return [];

    const nodes: TreeNode[] = [];

    // Nó raiz "Todas as fotos"
    nodes.push({
      id: 'root',
      label: this.languageService.t('userDashboard.allPhotos'),
      data: null,
      children: this.buildDynamicFolderNodes(null),
      expanded: true
    });

    // Pasta fixa: Minhas Fotos
    nodes.push({
      id: 'fixed-minhas-fotos',
      label: 'Minhas Fotos',
      data: 'fixed-minhas-fotos',
      children: [],
      expanded: false
    });

    // Pasta fixa: Minha Melhor Turma de Inglês
    nodes.push({
      id: 'fixed-minha-melhor-turma-de-ingles',
      label: 'Minha Melhor Turma de Inglês',
      data: 'fixed-minha-melhor-turma-de-ingles',
      children: [],
      expanded: false
    });

    return nodes;
  }

  /**
   * Constrói nós de pastas dinâmicas recursivamente
   */
  private buildDynamicFolderNodes(parentId: string | null): TreeNode[] {
    return this.folders()
      .filter(f => f.parentId === parentId)
      .map(folder => ({
        id: folder.id,
        label: folder.name,
        data: folder.id,
        children: this.buildDynamicFolderNodes(folder.id),
        expanded: false
      }));
  }

  /**
   * Seleciona uma pasta na árvore
   */
  onFolderSelect(event: any): void {
    const nodeData = event.data;
    console.log('Pasta selecionada (data):', nodeData);
    
    this.selectedFolderId.set(nodeData);
    this.loadPhotos();
  }

  /**
   * Cria nova pasta
   */
  createFolder(): void {
    this.parentFolderForCreate.set(null);
    this.createFolderName = '';
    this.showCreateDialog = true;
  }

  /**
   * Cria subpasta dentro de uma pasta existente
   */
  createSubfolder(folderData: any): void {
    // Não permite criar subpastas em pastas fixas
    if (typeof folderData === 'string' && folderData.startsWith('fixed-')) {
      this.showError('Não permitido', 'Não é possível criar subpastas dentro de pastas fixas');
      return;
    }

    const folder = this.folders().find(f => f.id === folderData);
    if (!folder) return;

    this.parentFolderForCreate.set(folder);
    this.createFolderName = '';
    this.showCreateDialog = true;
  }

  /**
   * Salva a criação da pasta
   */
  saveCreateFolder(): void {
    const user = this.currentUser();
    if (!user || !this.createFolderName.trim()) return;

    const parentId = this.parentFolderForCreate()?.id || null;
    
    this.storageService.createFolder(user.id, this.createFolderName.trim(), parentId);
    this.loadData();
    
    const folderType = parentId ? 'Subpasta' : 'Pasta';
    this.showSuccess(`${folderType} criada`, `${folderType} "${this.createFolderName}" criada com sucesso`);
    
    this.closeCreateDialog();
  }

  /**
   * Fecha modal de criar pasta
   */
  closeCreateDialog(): void {
    this.showCreateDialog = false;
    this.createFolderName = '';
    this.parentFolderForCreate.set(null);
  }

  /**
   * Edita nome de uma pasta
   */
  editFolder(folderData: any): void {
    // Não permite editar pastas fixas
    if (typeof folderData === 'string' && folderData.startsWith('fixed-')) {
      this.showError('Não permitido', 'Não é possível editar pastas fixas');
      return;
    }

    const folder = this.folders().find(f => f.id === folderData);
    if (!folder) return;

    this.folderToEdit.set(folder);
    this.newFolderName = folder.name;
    this.showEditDialog = true;
  }

  /**
   * Salva a edição da pasta
   */
  saveEditFolder(): void {
    const folder = this.folderToEdit();
    if (!folder || !this.newFolderName.trim() || this.newFolderName.trim() === folder.name) {
      this.closeEditDialog();
      return;
    }

    this.storageService.renameFolder(folder.id, this.newFolderName.trim());
    this.loadData();
    this.showSuccess('Pasta renomeada', `Pasta renomeada para "${this.newFolderName}"`);
    
    this.closeEditDialog();
  }

  /**
   * Fecha modal de editar pasta
   */
  closeEditDialog(): void {
    this.showEditDialog = false;
    this.newFolderName = '';
    this.folderToEdit.set(null);
  }

  /**
   * Exclui uma pasta
   */
  deleteFolder(folderData: any): void {
    // Não permite deletar pastas fixas
    if (typeof folderData === 'string' && folderData.startsWith('fixed-')) {
      this.showError('Não permitido', 'Não é possível deletar pastas fixas');
      return;
    }

    const folder = this.folders().find(f => f.id === folderData);
    if (!folder) return;

    this.folderToDelete.set(folder);
    this.showDeleteDialog = true;
  }

  /**
   * Confirma a exclusão da pasta
   */
  confirmDeleteFolder(): void {
    const folder = this.folderToDelete();
    if (!folder) return;

    this.storageService.deleteFolder(folder.id);
    this.loadData();

    // Se a pasta excluída estava selecionada, volta para "Todas as fotos"
    if (this.selectedFolderId() === folder.id) {
      this.selectedFolderId.set(null);
    }

    this.showSuccess('Pasta excluída', `Pasta "${folder.name}" excluída com sucesso`);
    this.closeDeleteDialog();
  }

  /**
   * Fecha modal de deletar pasta
   */
  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.folderToDelete.set(null);
  }

  /**
   * Manipula seleção de arquivos (ATUALIZADO PARA UPLOAD MÚLTIPLO)
   */
  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0 || !this.currentUser()) return;

    const selectedId = this.selectedFolderId();

    this.isUploading.set(true);
    const user = this.currentUser()!;

    // Converte FileList para Array
    const filesArray = Array.from(files);

    // Valida todos os arquivos antes
    for (const file of filesArray) {
      if (!file.type.startsWith('image/')) {
        this.showError('Erro no upload', `${file.name} não é uma imagem válida`);
        this.isUploading.set(false);
        input.value = '';
        return;
      }

      const storageLimit = this.storageService.getStorageLimit(user.plan);
      if (user.storageUsed + file.size > storageLimit) {
        this.showError('Limite excedido', 'Você atingiu o limite de armazenamento do seu plano');
        this.isUploading.set(false);
        input.value = '';
        return;
      }
    }

    console.log(`Fazendo upload de ${filesArray.length} arquivo(s)`);

    // Detecta se é upload para pasta fixa
    const isUploadingToFixedFolder = selectedId ? this.isFixedFolder(selectedId) : false;
    const s3FolderName = isUploadingToFixedFolder && selectedId ? this.getFixedFolderName(selectedId) ?? undefined : undefined;

    // Upload múltiplo otimizado
    this.uploadService.uploadMultipleFiles(filesArray, s3FolderName).subscribe({
      next: (results: UploadResponse[]) => {
        console.log('Upload múltiplo concluído:', results);

        // Conta sucessos e falhas
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        // Para pastas fixas, não salva no localStorage
        if (!isUploadingToFixedFolder) {
          // Salva as fotos bem-sucedidas no localStorage
          let totalSize = 0;
          const photos = this.storageService.getPhotos();

          results.forEach((result, index) => {
            if (result.success) {
              const file = filesArray[index];

              const photo: Photo = {
                id: crypto.randomUUID(),
                userId: user.id,
                folderId: this.selectedFolderId(),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                dataUrl: result.fileUrl,
                s3Key: result.fileKey,
                bucketName: result.bucketName
              };

              photos.push(photo);
              totalSize += file.size;
            }
          });

          this.storageService.savePhotos(photos);

          // Atualiza storage usado
          this.storageService.updateUser(user.id, {
            storageUsed: user.storageUsed + totalSize
          });

          // Atualiza user
          const updatedUser = this.storageService.getCurrentUser();
          if (updatedUser) {
            this.currentUser.set(updatedUser);
          }
        }

        // Mensagem de sucesso
        if (successful > 0 && failed === 0) {
          this.showSuccess(
            'Upload realizado!',
            `${successful} foto(s) enviada(s) com sucesso`
          );
        } else if (successful > 0 && failed > 0) {
          this.showError(
            'Upload parcial',
            `${successful} foto(s) enviada(s), ${failed} falharam`
          );
        } else {
          this.showError(
            'Erro no upload',
            'Todas as fotos falharam no upload'
          );
        }

        // Recarrega fotos
        this.loadPhotos();

        // Se foi upload para pasta fixa, atualiza contador
        if (isUploadingToFixedFolder) {
          this.loadFixedPhotosCount();
        }

        this.isUploading.set(false);
        input.value = '';
      },
      error: (error) => {
        console.error('Erro no upload múltiplo:', error);
        this.showError('Erro no upload', error.message || 'Falha ao enviar arquivos');
        this.isUploading.set(false);
        input.value = '';
      }
    });
  }

  /**
   * Abre seletor de arquivos
   */
  openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Faz download de uma foto
   */
  downloadPhoto(photo: PhotoWithUrl): void {
    if (!photo.s3Key) {
      this.showError('Erro', 'Chave S3 não encontrada');
      return;
    }

    this.uploadService.getDownloadUrl(photo.s3Key).subscribe({
      next: (url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = photo.name;
        link.click();
        this.showSuccess('Download iniciado', `Baixando ${photo.name}`);
      },
      error: (error) => {
        console.error('Erro ao gerar URL de download:', error);
        this.showError('Erro', 'Falha ao gerar link de download');
      }
    });
  }

  /**
   * Deleta uma foto
   */
  deletePhoto(photo: PhotoWithUrl): void {
    if (!confirm(this.languageService.t('userDashboard.deletePhotoConfirm'))) {
      return;
    }

    // Se é pasta fixa, não permite deletar
    // if (photo.folderId && this.isFixedFolder(photo.folderId)) {
    //   this.showError(
    //     'Exclusão não permitida',
    //     'Não é possível excluir fotos das pastas fixas através do dashboard. Use o console S3.'
    //   );
    //   return;
    // }

    // Se a foto tem s3Key, deleta do S3 também
    if (photo.s3Key) {
      this.uploadService.deleteFile(photo.s3Key).subscribe({
        next: (response) => {
          console.log('Arquivo deletado do S3:', response);
          
          this.storageService.deletePhoto(photo.id);
          this.showSuccess('Foto excluída', 'A foto foi removida do S3 e do seu armazenamento');

          const updatedUser = this.storageService.getCurrentUser();
          if (updatedUser) {
            this.currentUser.set(updatedUser);
          }

          this.loadPhotos();
        },
        error: (error) => {
          console.error('Erro ao deletar do S3:', error);
          
          this.storageService.deletePhoto(photo.id);
          this.showError('Aviso', 'A foto foi removida localmente, mas pode ainda estar no S3');
          
          this.loadPhotos();
        }
      });
    } else {
      this.storageService.deletePhoto(photo.id);
      this.showSuccess('Foto excluída', 'A foto foi removida do seu armazenamento');

      const updatedUser = this.storageService.getCurrentUser();
      if (updatedUser) {
        this.currentUser.set(updatedUser);
      }

      this.loadPhotos();
    }
  }

  /**
   * Obtém itens do menu de mover para uma foto
   */
  getMoveMenuItems(photo: PhotoWithUrl): MenuItem[] {
    // Não permite mover fotos de pastas fixas
    if (photo.folderId && this.isFixedFolder(photo.folderId)) {
      return [
        {
          label: 'Não é possível mover fotos de pastas fixas',
          disabled: true,
          icon: 'pi pi-lock'
        }
      ];
    }

    const allFolders = this.folders();
    const flatFolderList: MenuItem[] = [];

    const buildFlatList = (parentId: string | null, level: number = 0): void => {
      allFolders
        .filter(f => f.parentId === parentId)
        .forEach(folder => {
          const indent = level > 0 ? '\u00A0\u00A0'.repeat(level) : '';
          flatFolderList.push({
            label: `${indent}${folder.name}`,
            icon: 'pi pi-folder',
            command: () => this.movePhoto(photo.id, folder.id),
            styleClass: 'move-menu-item'
          });
          buildFlatList(folder.id, level + 1);
        });
    };

    buildFlatList(null);

    return [
      {
        label: this.languageService.t('userDashboard.allPhotos'),
        icon: 'pi pi-folder-open',
        command: () => this.movePhoto(photo.id, null),
        styleClass: 'move-menu-item'
      },
      ...flatFolderList
    ];
  }

  /**
   * Move foto para outra pasta
   */
  movePhoto(photoId: string, folderId: string | null): void {
    this.storageService.movePhotoToFolder(photoId, folderId);
    this.showSuccess('Foto movida', 'Foto movida com sucesso');
    this.loadPhotos();
  }

  /**
   * Trata erro ao carregar imagem
   */
  onImageError(event: Event, photo: PhotoWithUrl): void {
    console.error('Erro ao carregar imagem:', photo.name);
    
    const updatedPhotos = this.photos().map(p => 
      p.id === photo.id ? { ...p, displayUrl: undefined, isLoadingUrl: false } : p
    );
    this.photos.set(updatedPhotos);
  }

  /**
   * Calcula porcentagem de storage usado
   */
  getStoragePercentage(): number {
    const user = this.currentUser();
    if (!user) return 0;

    const limit = this.storageService.getStorageLimit(user.plan);
    if (limit === Infinity) return 0;

    return (user.storageUsed / limit) * 100;
  }

  /**
   * Formata bytes em formato legível
   */
  formatBytes(bytes: number): string {
    return this.storageService.formatBytes(bytes);
  }

  /**
   * Obtém limite de storage formatado
   */
  getStorageLimitFormatted(): string {
    const user = this.currentUser();
    if (!user) return '';

    const limit = this.storageService.getStorageLimit(user.plan);
    return limit === Infinity ? 'Ilimitado' : this.formatBytes(limit);
  }

  /**
   * Obtém total de fotos do usuário (localStorage + pastas fixas S3)
   */
  getTotalPhotos(): number {
    const user = this.currentUser();
    if (!user) return 0;

    // Conta apenas fotos das pastas DINÂMICAS (localStorage), excluindo as fixas
    const allPhotos = this.storageService.getUserPhotos(user.id);
    const dynamicFoldersPhotos = allPhotos.filter(photo => {
      // Exclui fotos que estão nas pastas fixas do localStorage
      return !photo.folderId ||
             (photo.folderId !== 'fixed-minhas-fotos' &&
              photo.folderId !== 'fixed-minha-melhor-turma-de-ingles');
    }).length;

    // Soma fotos dinâmicas + fotos das pastas fixas S3
    const fixedFoldersPhotos = this.totalFixedPhotosCount();

    return dynamicFoldersPhotos + fixedFoldersPhotos;
  }

  /**
   * Obtém nome da pasta atual
   */
  getCurrentFolderName(): string {
    const folderId = this.selectedFolderId();
    
    if (!folderId) {
      return this.languageService.t('userDashboard.allPhotos');
    }

    // Verifica se é pasta fixa
    if (folderId === 'fixed-minhas-fotos') {
      return 'Minhas Fotos';
    }
    if (folderId === 'fixed-minha-melhor-turma-de-ingles') {
      return 'Minha Melhor Turma de Inglês';
    }

    // Pasta dinâmica
    const folder = this.folders().find(f => f.id === folderId);
    return folder?.name || this.languageService.t('userDashboard.allPhotos');
  }

    /**
   * Obtém o nome traduzido do plano do usuário
   */
  getTranslatedPlan(): string {
    const user = this.currentUser();
    if (!user) return '';

    const planKey = `plans.${user.plan.toLowerCase()}.name`;
    return this.languageService.t(planKey);
  }

  /**
   * Exibe mensagem de sucesso
   */
  private showSuccess(title: string, message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message
    });
  }

  /**
   * Exibe mensagem de erro
   */
  private showError(title: string, message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message
    });
  }
}
