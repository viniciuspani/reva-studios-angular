import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { StorageService } from '../../services/storage.service';
import { LanguageService } from '../../services/language.service';
import { User } from '../../models/user.model';
import { Photo } from '../../models/photo.model';
import { Folder } from '../../models/folder.model';

/**
 * Componente do dashboard do usuário
 * Gerencia upload, visualização e organização de fotos em pastas
 */
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    FileUploadModule,
    ToastModule,
    MenuModule,
    TreeModule,
    NavbarComponent
  ],
  providers: [MessageService],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private messageService = inject(MessageService);
  public languageService = inject(LanguageService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Signals para controle de estado
  currentUser = signal<User | null>(null);
  photos = signal<Photo[]>([]);
  folders = signal<Folder[]>([]);
  selectedFolderId = signal<string | null>(null);
  isUploading = signal(false);
  selectedFile = signal<{ name: string; path: string } | null>(null);

  // Tree nodes para exibição de pastas
  folderNodes: TreeNode[] = [];

  ngOnInit(): void {
    // Verifica autenticação
    const user = this.storageService.getCurrentUser();
    if (!user || user.role !== 'user') {
      this.router.navigate(['/auth']);
      return;
    }
    this.currentUser.set(user);
    this.loadData();
  }

  /**
   * Carrega dados de pastas e fotos
   */
  loadData(): void {
    const user = this.currentUser();
    if (!user) return;

    const userFolders = this.storageService.getUserFolders(user.id);
    this.folders.set(userFolders);
    this.buildFolderTree(userFolders);
    this.loadPhotos();
  }

  /**
   * Carrega fotos da pasta selecionada
   */
  loadPhotos(): void {
    const user = this.currentUser();
    if (!user) return;

    const userPhotos = this.storageService.getUserPhotos(user.id, this.selectedFolderId());
    this.photos.set(userPhotos);
  }

  /**
   * Constrói árvore de pastas para o componente tree
   */
  buildFolderTree(folders: Folder[]): void {
    const buildNode = (folderId: string | null): TreeNode[] => {
      return folders
        .filter(f => f.parentId === folderId)
        .map(folder => ({
          label: folder.name,
          data: folder.id,
          icon: 'pi pi-folder',
          children: buildNode(folder.id)
        }));
    };

    this.folderNodes = [
      {
        label: 'Todas as fotos',
        data: null,
        icon: 'pi pi-folder-open',
        expanded: true,
        children: buildNode(null)
      }
    ];
  }

  /**
   * Seleciona uma pasta no tree
   */
  onFolderSelect(event: any): void {
    this.selectedFolderId.set(event.node.data);
    this.loadPhotos();
  }

  /**
   * Cria nova pasta
   */
  createFolder(): void {
    const user = this.currentUser();
    if (!user) return;

    const folderName = prompt('Nome da pasta:');
    if (!folderName || !folderName.trim()) return;

    this.storageService.createFolder(user.id, folderName.trim(), this.selectedFolderId());
    this.loadData();
    this.showSuccess('Pasta criada', `Pasta "${folderName}" criada com sucesso`);
  }

  /**
   * Manipula seleção de arquivos
   */
  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || !this.currentUser()) return;

    this.isUploading.set(true);
    const user = this.currentUser()!;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      this.selectedFile.set({
        name: file.name,
        path: file.name
      });

      // Valida tipo de arquivo
      if (!file.type.startsWith('image/')) {
        this.showError('Erro no upload', `${file.name} não é uma imagem válida`);
        continue;
      }

      try {
        await this.storageService.uploadPhoto(user.id, file, this.selectedFolderId());
        this.showSuccess('Upload realizado!', `${file.name} foi enviada com sucesso`);

        // Atualiza user no signal
        const updatedUser = this.storageService.getCurrentUser();
        if (updatedUser) {
          this.currentUser.set(updatedUser);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar arquivo';
        this.showError('Erro no upload', errorMessage);
      }
    }

    this.isUploading.set(false);
    this.loadPhotos();
    input.value = ''; // Reset input
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
  downloadPhoto(photo: Photo): void {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = photo.name;
    link.click();

    this.showSuccess('Download iniciado', `Baixando ${photo.name}`);
  }

  /**
   * Deleta uma foto
   */
  deletePhoto(photo: Photo): void {
    if (confirm('Tem certeza que deseja excluir esta foto?')) {
      this.storageService.deletePhoto(photo.id);
      this.showSuccess('Foto excluída', 'A foto foi removida do seu armazenamento');

      // Atualiza user no signal
      const updatedUser = this.storageService.getCurrentUser();
      if (updatedUser) {
        this.currentUser.set(updatedUser);
      }

      this.loadPhotos();
    }
  }

  /**
   * Obtém itens do menu de contexto para uma foto
   */
  getPhotoMenuItems(photo: Photo): MenuItem[] {
    const allFolders = this.folders();

    // Constrói menu de pastas recursivamente
    const buildFolderMenu = (parentId: string | null): MenuItem[] => {
      return allFolders
        .filter(f => f.parentId === parentId)
        .map(folder => ({
          label: folder.name,
          icon: 'pi pi-folder',
          command: () => this.movePhoto(photo.id, folder.id),
          items: buildFolderMenu(folder.id)
        }));
    };

    return [
      {
        label: 'Baixar',
        icon: 'pi pi-download',
        command: () => this.downloadPhoto(photo)
      },
      {
        label: 'Mover para',
        icon: 'pi pi-arrows-alt',
        items: [
          {
            label: 'Raiz',
            icon: 'pi pi-folder',
            command: () => this.movePhoto(photo.id, null)
          },
          ...buildFolderMenu(null)
        ]
      },
      {
        separator: true
      },
      {
        label: 'Excluir',
        icon: 'pi pi-trash',
        command: () => this.deletePhoto(photo)
      }
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
   * Obtém total de fotos do usuário
   */
  getTotalPhotos(): number {
    const user = this.currentUser();
    if (!user) return 0;

    return this.storageService.getUserPhotos(user.id).length;
  }

  /**
   * Obtém nome da pasta atual
   */
  getCurrentFolderName(): string {
    const folderId = this.selectedFolderId();
    if (!folderId) return 'Todas as fotos';

    const folder = this.folders().find(f => f.id === folderId);
    return folder?.name || 'Todas as fotos';
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