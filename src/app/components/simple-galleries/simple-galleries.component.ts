import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SimpleFolderService, SimplePhoto } from '../../services/simple-folder.service';

@Component({
  selector: 'app-simple-galleries',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ProgressSpinnerModule],
  template: `
    <div class="galleries-container">
      <h1>Minhas Galerias</h1>

      <!-- Galeria 1: Minhas Fotos -->
      <p-card>
        <ng-template pTemplate="header">
          <div class="gallery-header">
            <h2>📸 Minhas Fotos</h2>
            <p-button 
              icon="pi pi-refresh" 
              [rounded]="true"
              [text]="true"
              (onClick)="loadMinhasFotos()"
              [loading]="loadingMinhasFotos()">
            </p-button>
          </div>
        </ng-template>

        <div *ngIf="loadingMinhasFotos()" class="loading">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <p>Carregando fotos...</p>
        </div>

        <div *ngIf="!loadingMinhasFotos() && minhasFotos().length > 0" class="photos-grid">
          <div *ngFor="let photo of minhasFotos()" class="photo-card">
            <img [src]="getPhotoUrl(photo.key)" [alt]="photo.name">
            <div class="photo-info">
              <span class="name">{{ photo.name }}</span>
              <span class="size">{{ formatBytes(photo.size) }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="!loadingMinhasFotos() && minhasFotos().length === 0" class="empty">
          <i class="pi pi-images"></i>
          <p>Nenhuma foto encontrada</p>
        </div>
      </p-card>

      <!-- Galeria 2: Turma de Inglês -->
      <p-card>
        <ng-template pTemplate="header">
          <div class="gallery-header">
            <h2>👥 Minha Melhor Turma de Inglês</h2>
            <p-button 
              icon="pi pi-refresh" 
              [rounded]="true"
              [text]="true"
              (onClick)="loadTurmaIngles()"
              [loading]="loadingTurma()">
            </p-button>
          </div>
        </ng-template>

        <div *ngIf="loadingTurma()" class="loading">
          <p-progressSpinner styleClass="w-4rem h-4rem"></p-progressSpinner>
          <p>Carregando fotos...</p>
        </div>

        <div *ngIf="!loadingTurma() && turmaIngles().length > 0" class="photos-grid">
          <div *ngFor="let photo of turmaIngles()" class="photo-card">
            <img [src]="getPhotoUrl(photo.key)" [alt]="photo.name">
            <div class="photo-info">
              <span class="name">{{ photo.name }}</span>
              <span class="size">{{ formatBytes(photo.size) }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="!loadingTurma() && turmaIngles().length === 0" class="empty">
          <i class="pi pi-images"></i>
          <p>Nenhuma foto encontrada</p>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .galleries-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      color: #1e293b;
      margin-bottom: 2rem;
      font-size: 2rem;
    }

    p-card {
      margin-bottom: 2rem;
    }

    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .gallery-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .photo-card {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      background: white;
    }

    .photo-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .photo-card img {
      width: 100%;
      height: 250px;
      object-fit: cover;
      display: block;
    }

    .photo-info {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .photo-info .name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .photo-info .size {
      color: #64748b;
      font-size: 0.85rem;
    }

    .loading, .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: #64748b;
    }

    .empty i {
      font-size: 4rem;
      color: #cbd5e1;
    }

    .empty p {
      font-size: 1.1rem;
    }
  `]
})
export class SimpleGalleriesComponent implements OnInit {
  private folderService = inject(SimpleFolderService);

  minhasFotos = signal<SimplePhoto[]>([]);
  turmaIngles = signal<SimplePhoto[]>([]);
  loadingMinhasFotos = signal(false);
  loadingTurma = signal(false);

  ngOnInit() {
    this.loadMinhasFotos();
    this.loadTurmaIngles();
  }

  loadMinhasFotos() {
    this.loadingMinhasFotos.set(true);
    
    this.folderService.getMinhasFotos().subscribe({
      next: (response) => {
        this.minhasFotos.set(response.photos);
        this.loadingMinhasFotos.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar Minhas Fotos:', error);
        this.loadingMinhasFotos.set(false);
      }
    });
  }

  loadTurmaIngles() {
    this.loadingTurma.set(true);
    
    this.folderService.getTurmaIngles().subscribe({
      next: (response) => {
        this.turmaIngles.set(response.photos);
        this.loadingTurma.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar Turma de Inglês:', error);
        this.loadingTurma.set(false);
      }
    });
  }

  getPhotoUrl(s3Key: string): string {
    return this.folderService.getPhotoUrl(s3Key);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}