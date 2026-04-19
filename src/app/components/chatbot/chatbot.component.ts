import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <!-- Floating Toggle Button -->
    <button 
      (click)="toggleChat()"
      class="fixed bottom-6 right-6 w-14 h-14 bg-tactical-green hover:bg-white rounded border-2 border-black shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center justify-center text-black transition-all duration-300 z-50 hover:scale-110 active:scale-95 group"
      [class.hidden]="isOpen()">
      <mat-icon class="scale-110 group-hover:animate-pulse">smart_toy</mat-icon>
      <!-- Notification dot -->
      <span class="absolute -top-1 -right-1 flex h-4 w-4">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-tactical-red opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-tactical-red border-2 border-black"></span>
      </span>
    </button>

    <!-- Chat Window -->
    @if (isOpen()) {
      <div 
        class="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-tactical-panel border border-tactical-border rounded shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-50 animate-fade-in-up"
        style="animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
        
        <!-- Header -->
        <div class="bg-zinc-950 p-4 flex justify-between items-center border-b border-tactical-border relative overflow-hidden">
          <div class="flex items-center gap-3 relative z-10">
            <div class="w-9 h-9 rounded border border-tactical-green/30 bg-tactical-green/10 flex items-center justify-center text-tactical-green">
              <mat-icon class="text-[18px]">smart_toy</mat-icon>
            </div>
            <div>
              <h3 class="text-white font-black text-[11px] tracking-widest uppercase font-mono">Tactical AI Advisor</h3>
              <p class="text-[8px] text-tactical-green font-black uppercase tracking-[0.2em] flex items-center gap-1.5 mt-0.5">
                <span class="relative flex h-1.5 w-1.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-tactical-green opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-tactical-green"></span>
                </span>
                Link Established
              </p>
            </div>
          </div>
          <button (click)="toggleChat()" class="text-zinc-600 hover:text-white transition-all duration-300 p-1.5 rounded hover:bg-white/5">
            <mat-icon class="text-[18px]">close</mat-icon>
          </button>
        </div>

        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative bg-black/20" #scrollContainer>
          <!-- Background watermark -->
          <mat-icon class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] text-tactical-green/[0.03] pointer-events-none">security</mat-icon>

          @for (msg of messages(); track msg.timestamp; let i = $index) {
            <div class="flex gap-3 animate-fade-in-up" [class.flex-row-reverse]="msg.role === 'user'" [style.animation-delay]="(i * 50) + 'ms'" style="animation: fadeInUp 0.4s ease-out both;">
              <div class="w-7 h-7 rounded border flex-shrink-0 flex items-center justify-center text-[10px] font-black font-mono"
                   [class.bg-tactical-green/10]="msg.role === 'model'"
                   [class.text-tactical-green]="msg.role === 'model'"
                   [class.border-tactical-green/30]="msg.role === 'model'"
                   [class.bg-zinc-900]="msg.role === 'user'"
                   [class.text-zinc-500]="msg.role === 'user'"
                   [class.border-zinc-800]="msg.role === 'user'">
                <mat-icon class="text-[14px] h-3.5 w-3.5">{{ msg.role === 'model' ? 'smart_toy' : 'person' }}</mat-icon>
              </div>
              
              <div class="max-w-[85%] rounded px-3 py-2 text-[11px] leading-relaxed relative group font-sans"
                   [class.bg-zinc-900/80]="msg.role === 'model'"
                   [class.text-zinc-300]="msg.role === 'model'"
                   [class.border]="msg.role === 'model'"
                   [class.border-tactical-border]="msg.role === 'model'"
                   [class.bg-tactical-green/10]="msg.role === 'user'"
                   [class.text-white]="msg.role === 'user'"
                   [class.border-tactical-green/20]="msg.role === 'user'">
                <div [innerHTML]="formatMessage(msg.text)" class="prose prose-invert prose-xs max-w-none prose-p:my-1 prose-strong:text-tactical-green"></div>
                <div class="text-[7px] opacity-0 group-hover:opacity-30 transition-opacity mt-1 absolute -bottom-3 font-mono uppercase tracking-widest"
                     [class.right-0]="msg.role === 'user'"
                     [class.left-0]="msg.role === 'model'">
                  {{ msg.timestamp | date:'HH:mm:ss' }}
                </div>
              </div>
            </div>
          }

          @if (isLoading()) {
            <div class="flex gap-3 animate-fade-in-up">
              <div class="w-7 h-7 rounded border border-tactical-green/30 bg-tactical-green/10 flex-shrink-0 flex items-center justify-center text-tactical-green">
                <mat-icon class="text-[14px] h-3.5 w-3.5">smart_toy</mat-icon>
              </div>
              <div class="bg-zinc-900/80 border border-tactical-border rounded px-4 py-3 flex items-center gap-1.5">
                <div class="w-1 h-1 bg-tactical-green rounded-full animate-bounce"></div>
                <div class="w-1 h-1 bg-tactical-green rounded-full animate-bounce delay-100"></div>
                <div class="w-1 h-1 bg-tactical-green rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-zinc-950 border-t border-tactical-border relative z-10">
          <div class="relative flex items-center">
            <input 
              type="text" 
              [(ngModel)]="userInput" 
              (keydown.enter)="sendMessage()"
              placeholder="REQUEST TACTICAL DATA..." 
              class="w-full bg-zinc-900 text-white text-[10px] font-mono uppercase tracking-widest rounded border border-tactical-border pl-4 pr-10 py-3 focus:border-tactical-green/50 outline-none transition-all placeholder:text-zinc-700"
              [disabled]="isLoading()">
            
            <button 
              (click)="sendMessage()"
              [disabled]="!userInput.trim() || isLoading()"
              class="absolute right-2 w-7 h-7 flex items-center justify-center rounded bg-tactical-green hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-black transition-colors">
              <mat-icon class="text-[16px] h-[16px] w-[16px]">send</mat-icon>
            </button>
          </div>
          <div class="text-[8px] text-zinc-600 text-center mt-3 font-black uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-1">
            <div class="flex items-center gap-1">
              <mat-icon class="text-[10px] h-2.5 w-2.5">bolt</mat-icon> GEMINI TACTICAL CORE ACTIVE
            </div>
            <div class="text-tactical-green/40">CHIEF STRATEGIST: MARWAN NEGM</div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .delay-100 { animation-delay: 150ms; }
    .delay-200 { animation-delay: 300ms; }
  `]
})
export class ChatbotComponent implements AfterViewChecked {
  private apiService = inject(ApiService);
  
  isOpen = signal(false);
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([
    { role: 'model', text: "Hello! I'm your AI Crypto Assistant. I can analyze market trends, check news, and answer your crypto questions using real-time data. How can I help you today?", timestamp: new Date() }
  ]);
  userInput = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // Ignore scroll errors
    }
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading()) return;

    const userMsg = this.userInput.trim();
    this.userInput = '';
    
    // Add user message
    this.messages.update(msgs => [...msgs, { role: 'user', text: userMsg, timestamp: new Date() }]);
    this.isLoading.set(true);

    // Prepare history for API
    const history = this.messages().slice(0, -1).map(m => ({
      role: m.role,
      text: m.text
    }));

    this.apiService.getChatResponse(userMsg, history).subscribe({
      next: (response) => {
        this.messages.update(msgs => [...msgs, { 
          role: 'model', 
          text: response.text, 
          timestamp: new Date() 
        }]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.messages.update(msgs => [...msgs, { 
          role: 'model', 
          text: "I'm having trouble connecting to the server right now. Please try again later.", 
          timestamp: new Date() 
        }]);
        this.isLoading.set(false);
      }
    });
  }

  formatMessage(text: string): string {
    // Basic markdown formatting for bold and links
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
}
