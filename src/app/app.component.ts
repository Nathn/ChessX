import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  OnDestroy,
  Input,
  Output,
  HostListener
} from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';
import {
  environment
} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {
  @Input() loggedIn: boolean = parseInt(localStorage.getItem('loggedIn') || '0') === 1;

  public title = 'ChessX';
  public blackTileColor = 'rgb(52, 80, 106)';
  public whiteTileColor = 'rgb(162, 161, 146)';
  public UIColor = 'rgba(125, 87, 75, 0.75)';
  public boardSize = 800;
  public boardSizeRelative = 0.85;
  public tchatLimit = 50;

  public password: string = "";
  public whiteName: string = "White";
  public blackName: string = "Black";
  public tchatInputValue: string = "";
  public controlsVisible: boolean = true;
  public tchatVisible: boolean = true;
  public freeMode: boolean = false;
  public tchatMessages: {
    text: String,
    datetime: Date
  }[] = [];

  private canvas: HTMLCanvasElement = this.renderer.createElement('canvas');
  private stats: HTMLDivElement = this.renderer.createElement('div');
  private ctx: CanvasRenderingContext2D = this.canvas.getContext('2d') as CanvasRenderingContext2D;
  private currentPos: string = "";
  private moves: {
    fen: String,
    color: String
  }[] = [];
  private selectedPiecePosition: { row: number, col: number } = { row: -1, col: -1 };
  private color: string = "white";
  private refreshSetTimeout: any;
  private refreshTchatSetTimeout: any;

  private START_POSITION = "rnbqkbnr/pppppppp/......../......../......../......../PPPPPPPP/RNBQKBNR"

  private pieces: { [key: string]: HTMLImageElement } = {};

  public playMovePieceAudio() {
    let movePieceAudio = new Audio();
    movePieceAudio.src = "../../../assets/sounds/move.mp3";
    movePieceAudio.load();
    movePieceAudio.play();
  }

  public login(): void {
    if (this.password === environment.password) {
      console.log("Logged in successfully!");
      this.loggedIn = true;
      localStorage.setItem('loggedIn', '1');
      clearInterval(this.refreshSetTimeout);
    }
  }

  public logout(): void {
    this.loggedIn = false;
    this.selectedPiecePosition = { row: -1, col: -1 };
    localStorage.setItem('loggedIn', '0');
    this.refreshSetTimeout = setInterval(() => this.refresh(), 1000);
  }

  public closeControls(): void {
    this.controlsVisible = false;
  }

  public closeTchat(): void {
    this.tchatVisible = false;
  }

  public refresh(): void {
    this.httpService.get("/game").subscribe((data: any) => {
      if (data) {
        if (!this.loggedIn || this.currentPos !== data.fen) {
          if (this.currentPos !== data.fen) {
            this.playMovePieceAudio();
          }
          this.loadPosition(data.fen);
          this.color = data.color;
        }
        this.moves = data.moves;
        this.stats.innerHTML = this.getStatsHTML();
      }
    });
  }

  public refreshTchat(): void {
    this.httpService.get("/tchat").subscribe((data: any) => {
      if (data) {
        this.tchatMessages = data.slice(-this.tchatLimit);
      }
    });
  }

  public getStatsHTML(): string {
    return `${this.whiteName} (Blancs) vs ${this.blackName} (Noirs)<br />Aux ${this.color === "white" ? "Blancs" : "Noirs"} de jouer<br />Coup #${Math.ceil(this.moves.length / 2)}`;
  }

  constructor(
    private httpService: HttpClient,
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    // preload the images
    const pieceNames = ['wp', 'wr', 'wn', 'wb', 'wq', 'wk', 'bp', 'br', 'bn', 'bb', 'bq', 'bk'];
    const promises = pieceNames.map(name => this.loadImage(`../assets/pieces/${name}.svg`));
    Promise.all(promises).then(images => {
      pieceNames.forEach((name, i) => {
        this.pieces[name] = images[i];
      });
      this.loadPosition(this.START_POSITION);
    });
  }

  public ngOnInit(): void {
    this.boardSize = Math.min(window.innerWidth, window.innerHeight) * this.boardSizeRelative;
    this.canvas.width = this.boardSize;
    this.canvas.height = this.boardSize;
    this.color = "white";
    this.renderer.appendChild(this.el.nativeElement, this.canvas);
    this.renderer.appendChild(this.el.nativeElement, this.stats);
    this.stats.classList.add('stats');
    this.loadPosition(this.START_POSITION);
    this.httpService.get("/game").subscribe((data: any) => {
      if (data) {
        this.loadPosition(data.fen);
        this.color = data.color;
        this.moves = data.moves;
        this.whiteName = data.white;
        this.blackName = data.black;
        this.stats.innerHTML = this.getStatsHTML();
      }
    });
    this.canvas.addEventListener('click', (event) => {
      if (this.loggedIn) {
        this.handleClick(event.offsetX, event.offsetY);
      }
    });
    this.refreshSetTimeout = setInterval(() => this.refresh(), 1000);
    this.refreshTchatSetTimeout = setInterval(() => this.refreshTchat(), 1000);
  }

  public reset(): void {
    this.loadPosition(this.START_POSITION);
    this.currentPos = this.START_POSITION;
    this.color = "white";
    this.selectedPiecePosition = { row: -1, col: -1 };
    this.httpService.post('/reset', {
      fen: this.currentPos,
      color: this.color
    }).subscribe((data: any) => {
      if (data) {
        this.loadPosition(data.fen);
        this.color = data.color;
        this.moves = data.moves;
        this.whiteName = data.white;
        this.blackName = data.black;
        this.stats.innerHTML = this.getStatsHTML();
      }
    });
  }

  public undo(): void {
    this.selectedPiecePosition = { row: -1, col: -1 };
    this.httpService.post('/undo', {
      fen: this.currentPos,
      color: this.color
    }).subscribe((data: any) => {
      if (data) {
        this.loadPosition(data.fen);
        this.color = data.color;
        this.moves = data.moves;
        this.whiteName = data.white;
        this.blackName = data.black;
        this.stats.innerHTML = this.getStatsHTML();
      }
    });
  }

  public updateNames(): void {
    this.httpService.post('/names', {
      white: this.whiteName,
      black: this.blackName
    }).subscribe((data: any) => {
      if (data) {
        this.whiteName = data.white;
        this.blackName = data.black;
      }
    });
  }

  public sendTchatMessage(): void {
    if (!this.tchatInputValue.trim()) {
      return;
    }
    this.httpService.post('/tchat', {
      text: this.tchatInputValue
    }).subscribe((data: any) => {
      if (data) {
        this.tchatInputValue = "";
        this.tchatMessages = data.slice(-this.tchatLimit);
      }
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = src;
    });
  }

  private loadPosition(fen: string): void {
    this.ctx.fillStyle = this.blackTileColor;
    this.ctx.fillRect(0, 0, this.boardSize, this.boardSize);
    this.ctx.fillStyle = this.whiteTileColor;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(i * (this.boardSize / 8), j * (this.boardSize / 8), (this.boardSize / 8), (this.boardSize / 8));
        }
      }
    }
    // draw A-H & 0-8
    this.ctx.font = `${this.boardSize / 20}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        this.ctx.fillStyle = this.whiteTileColor;
      } else {
        this.ctx.fillStyle = this.blackTileColor;
      }
      this.ctx.fillText(String.fromCharCode(65 + i), (i + 0.5) * (this.boardSize / 8), this.boardSize - (this.boardSize / 16));
    }
    for (let i = 6; i >= 0; i--) {
      if (i % 2 === 0) {
        this.ctx.fillStyle = this.blackTileColor;
      } else {
        this.ctx.fillStyle = this.whiteTileColor;
      }
      this.ctx.fillText(String.fromCharCode(56 - i), this.boardSize / 16, (i + 0.5) * (this.boardSize / 8));
    }
    const rows = fen.split('/');
    for (let i = 0; i < 8; i++) {
      let col = 0;
      for (let j = 0; j < rows[i].length; j++) {
        const c = rows[i].charAt(j);
        if (isNaN(Number(c))) { // if c is not a number, it's a piece
          let file: string = '';
          switch (c) {
            case 'p':
              file = 'bp'; break;
            case 'r':
              file = 'br'; break;
            case 'n':
              file = 'bn'; break;
            case 'b':
              file = 'bb'; break;
            case 'q':
              file = 'bq'; break;
            case 'k':
              file = 'bk'; break;
            case 'P':
              file = 'wp'; break;
            case 'R':
              file = 'wr'; break;
            case 'N':
              file = 'wn'; break;
            case 'B':
              file = 'wb'; break;
            case 'Q':
              file = 'wq'; break;
            case 'K':
              file = 'wk'; break;
          }
          const img = this.pieces[file];
          if (img) this.ctx.drawImage(img, col * (this.boardSize / 8), i * (this.boardSize / 8), (this.boardSize / 8), (this.boardSize / 8));
          // if the piece is selected, draw a red square around it
          if (this.selectedPiecePosition.row === i && this.selectedPiecePosition.col === col  && img) {
            this.ctx.strokeStyle = this.UIColor;
            this.ctx.lineWidth = 5;
            this.ctx.strokeRect(col * (this.boardSize / 8), i * (this.boardSize / 8), (this.boardSize / 8), (this.boardSize / 8));
          }
          // for the position, check with the moveIsValid function to see if the piece can move there
          // if so, draw a red dot on the square
          if (this.selectedPiecePosition.row !== -1 &&
              this.selectedPiecePosition.col !== -1 &&
              (this.selectedPiecePosition.row !== i ||
              this.selectedPiecePosition.col !== col)) {
            if (this.moveIsValid(this.selectedPiecePosition.row, this.selectedPiecePosition.col, i, col)) {
              this.ctx.fillStyle = this.UIColor;
              this.ctx.beginPath();
              this.ctx.arc(col * (this.boardSize / 8) + (this.boardSize / 16), i * (this.boardSize / 8) + (this.boardSize / 16), (this.boardSize / 80), 0, 2 * Math.PI);
              this.ctx.fill();
            }
          }

          col++;
        } else {
          col += parseInt(c); // move the column index by the number of empty squares
        }
      }
    }
    this.currentPos = fen;
  }

  private handleClick(x: number, y: number): void {
    const col = Math.floor(x / (this.boardSize / 8));
    const row = Math.floor(y / (this.boardSize / 8));
    if (this.selectedPiecePosition.row === -1) {
      this.selectedPiecePosition.row = row;
      this.selectedPiecePosition.col = col;
      this.loadPosition(this.currentPos);
    } else {
      const move = this.getNewPos(this.selectedPiecePosition.row, this.selectedPiecePosition.col, row, col);
      if (move === this.currentPos) {
        this.selectedPiecePosition.row = row;
        this.selectedPiecePosition.col = col;
      } else {
        this.selectedPiecePosition.row = -1;
        this.selectedPiecePosition.col = -1;
      }
      this.loadPosition(move);
    }
    this.httpService.post('/move', {
      fen: this.currentPos,
      color: this.color
    }).subscribe((data: any) => {
      if (data.success) {
        this.loadPosition(data.fen);
        this.color = data.color;
        this.moves = data.moves;
        this.stats.innerHTML = this.getStatsHTML();
      }
    });
  }

  getNewPos(startRow: number, startCol: number, endRow: number, endCol: number): string {
    // convert the current position to an array of rows
    const rows = this.currentPos.split("/");
    // get the piece being moved
    const piece = rows[startRow][startCol];
    // check if the move is valid
    if (!this.moveIsValid(startRow, startCol, endRow, endCol)) {
      return this.currentPos;
    }
    // remove the piece from the starting position
    rows[startRow] = rows[startRow].substr(0, startCol) + "." + rows[startRow].substr(startCol + 1);
    // place the piece in the ending position
    rows[endRow] = rows[endRow].substr(0, endCol) + piece + rows[endRow].substr(endCol + 1);
    // switch the player's color
    this.color = this.color === "white" ? "black" : "white";
    // join the rows back into a single string and return the new position
    return rows.join("/");
  }

  castle(color: string, side: string): void {
    // convert the current position to an array of rows
    const rows = this.currentPos.split("/");
    // get the king's starting position
    const startRow = color === "white" ? 7 : 0;
    const startCol = 4;
    // get the king's ending position
    const endRow = color === "white" ? 7 : 0;
    const endCol = side === "king" ? 6 : 2;
    // remove the king from the starting position
    rows[startRow] = rows[startRow].substr(0, startCol) + "." + rows[startRow].substr(startCol + 1);
    // place the king in the ending position
    rows[endRow] = rows[endRow].substr(0, endCol) + (color === "white" ? "K" : "k") + rows[endRow].substr(endCol + 1);
    // get the rook's starting position
    const rookStartRow = color === "white" ? 7 : 0;
    const rookStartCol = side === "king" ? 7 : 0;
    // get the rook's ending position
    const rookEndRow = color === "white" ? 7 : 0;
    const rookEndCol = side === "king" ? 5 : 3;
    // remove the rook from the starting position
    rows[rookStartRow] = rows[rookStartRow].substr(0, rookStartCol) + "." + rows[rookStartRow].substr(rookStartCol + 1);
    // place the rook in the ending position
    rows[rookEndRow] = rows[rookEndRow].substr(0, rookEndCol) + (color === "white" ? "R" : "r") + rows[rookEndRow].substr(rookEndCol + 1);
    // switch the player's color
    this.color = this.color === "white" ? "black" : "white";
    // join the rows back into a single string and return the new position
    this.loadPosition(rows.join("/"));
    this.httpService.post('/move', {
      fen: this.currentPos,
      color: this.color
    }).subscribe((data: any) => {
      if (data.success) {
        this.loadPosition(data.fen);
        this.color = data.color;
        this.moves = data.moves;
        this.stats.innerHTML = this.getStatsHTML();
      }
    });
  }

  moveIsValid(startRow: number, startCol: number, endRow: number, endCol: number): boolean {
    if (this.freeMode) {
      return true;
    }
    // convert the current position to an array of rows
    const rows = this.currentPos.split("/");
    // get the piece being moved and the piece at the ending position
    const startPiece = rows[startRow][startCol];
    const endPiece = rows[endRow][endCol];
    // check if the piece being moved is the same color as the player
    if ((startPiece.toLowerCase() === startPiece && this.color === "white") || (startPiece.toUpperCase() === startPiece && this.color === "black")) {
      return false;
    }
    // check if the piece is moving to the same square
    if (startRow === endRow && startCol === endCol) {
      return false;
    }
    let movingDirection: number = startPiece.toLowerCase() === startPiece ? 1 : -1;
    // check if the piece is a pawn
    if (startPiece.toLowerCase() === "p") {
      // check if the pawn is moving forward
      if (((startRow < endRow && movingDirection === 1) || (startRow > endRow && movingDirection === -1)) && this.currentPos.split("/")[endRow][endCol] == ".") {
        // check if the pawn is moving forward one space
        if (startRow + 1 * movingDirection === endRow && startCol === endCol) {
          return true;
        }
        // check if the pawn is moving forward two spaces
        if ((startRow + 2 * movingDirection === endRow && startCol === endCol && ((movingDirection === 1 && startRow === 1) || (movingDirection === -1 && startRow === 6))) && this.currentPos.split("/")[endRow][endCol] == "." && this.currentPos.split("/")[endRow - movingDirection][endCol] == ".") {
          return true;
        }
      }
      // check if the pawn is moving diagonally, and if there is a piece to capture
      if (((startRow + 1 * movingDirection === endRow && startCol + 1 === endCol) || (startRow + 1 * movingDirection === endRow && startCol - 1 === endCol)) && this.currentPos.split("/")[endRow][endCol] != ".") {
        if (((endPiece.toLowerCase() == endPiece) != (startPiece.toLowerCase() == startPiece))) {
          return true;
        }
      }
      return false;
    }
    // check if the piece is a knight
    if (startPiece.toLowerCase() === "n") {
      if ((startRow + 2 === endRow && startCol + 1 === endCol) ||
          (startRow + 2 === endRow && startCol - 1 === endCol) ||
          (startRow - 2 === endRow && startCol + 1 === endCol) ||
          (startRow - 2 === endRow && startCol - 1 === endCol) ||
          (startRow + 1 === endRow && startCol + 2 === endCol) ||
          (startRow + 1 === endRow && startCol - 2 === endCol) ||
          (startRow - 1 === endRow && startCol + 2 === endCol) ||
          (startRow - 1 === endRow && startCol - 2 === endCol)) {
        if (endPiece === "." || ((endPiece.toLowerCase() == endPiece) != (startPiece.toLowerCase() == startPiece))) {
          return true;
        }
      }
      return false;
    }
    // check if the piece is a bishop
    if (startPiece.toLowerCase() === "b") {
      if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol)) {
        let row = startRow;
        let col = startCol;
        while (row !== endRow && col !== endCol) {
          row += startRow < endRow ? 1 : -1;
          col += startCol < endCol ? 1 : -1;
          if (row !== endRow && col !== endCol && this.currentPos.split("/")[row][col] !== ".") {
            return false;
          }
        }
        if (endPiece === "." || ((endPiece.toLowerCase() == endPiece) != (startPiece.toLowerCase() == startPiece))) {
          return true;
        }
      }
      return false;
    }
    // check if the piece is a rook
    if (startPiece.toLowerCase() === "r") {
      if (startRow === endRow || startCol === endCol) {
        let row = startRow;
        let col = startCol;
        while (row !== endRow || col !== endCol) {
          if (startRow === endRow) {
            col += startCol < endCol ? 1 : -1;
          } else {
            row += startRow < endRow ? 1 : -1;
          }
          if ((row !== endRow || col !== endCol) && this.currentPos.split("/")[row][col] !== ".") {
            return false;
          }
        }
        if (endPiece === "." || ((endPiece.toLowerCase() == endPiece) != (startPiece.toLowerCase() == startPiece))) {
          return true;
        }
      }
      return false;
    }
    // check if the piece is a queen
    if (startPiece.toLowerCase() === "q") {
      if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol) || startRow === endRow || startCol === endCol) {
        let row = startRow;
        let col = startCol;
        while (row !== endRow || col !== endCol) {
          if (startRow === endRow || startCol === endCol) {
            if (startRow === endRow) {
              col += startCol < endCol ? 1 : -1;
            } else {
              row += startRow < endRow ? 1 : -1;
            }
          } else {
            row += startRow < endRow ? 1 : -1;
            col += startCol < endCol ? 1 : -1;
          }
          if ((row !== endRow || col !== endCol) && this.currentPos.split("/")[row][col] !== ".") {
            return false;
          }
        }
        if (endPiece === "." || ((endPiece.toLowerCase() == endPiece) != (startPiece.toLowerCase() == startPiece))) {
          return true;
        }
      }
      return false;
    }
    // check if the piece is a king
    if (startPiece.toLowerCase() === "k") {
      if ((startRow + 1 === endRow && startCol === endCol) ||
          (startRow - 1 === endRow && startCol === endCol) ||
          (startRow === endRow && startCol + 1 === endCol) ||
          (startRow === endRow && startCol - 1 === endCol) ||
          (startRow + 1 === endRow && startCol + 1 === endCol) ||
          (startRow + 1 === endRow && startCol - 1 === endCol) ||
          (startRow - 1 === endRow && startCol + 1 === endCol) ||
          (startRow - 1 === endRow && startCol - 1 === endCol)) {
        if (endPiece === "." || ((endPiece.toLowerCase() == endPiece) != (startPiece.toLowerCase() == startPiece))) {
          return true;
        }
      }
      return false;
    }
    return true;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.boardSize = Math.min(window.innerWidth, window.innerHeight) * this.boardSizeRelative;
    this.canvas.width = this.boardSize;
    this.canvas.height = this.boardSize;
    this.httpService.get("/game").subscribe((data: any) => {
      if (data) {
        this.loadPosition(data.fen);
        this.color = data.color;
        this.moves = data.moves;
        this.stats.innerHTML = this.getStatsHTML();
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.refreshSetTimeout) {
      clearTimeout(this.refreshSetTimeout);
    }
    if (this.refreshTchatSetTimeout) {
      clearTimeout(this.refreshTchatSetTimeout);
    }
  }
}
