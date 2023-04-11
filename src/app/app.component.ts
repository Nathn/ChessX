import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  OnDestroy,
} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {
  public title = 'ChessX';

  private canvas: HTMLCanvasElement = this.renderer.createElement('canvas');
  private ctx: CanvasRenderingContext2D = this.canvas.getContext('2d') as CanvasRenderingContext2D;
  private currentPos: string = "";
  private selectedPiecePosition: { row: number, col: number } = { row: -1, col: -1 };
  private color: string = "white";

  private START_POSITION = "rnbqkbnr/pppppppp/......../......../......../......../PPPPPPPP/RNBQKBNR"

  private pieces: { [key: string]: HTMLImageElement } = {};

  constructor(private el: ElementRef, private renderer: Renderer2) {
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
    this.canvas.width = 800;
    this.canvas.height = 800;
    this.renderer.appendChild(this.el.nativeElement, this.canvas);
    this.loadPosition(this.START_POSITION);
    this.canvas.addEventListener('click', (event) =>
      this.handleClick(event.offsetX, event.offsetY)
    );
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
    this.ctx.fillStyle = 'rgb(52, 80, 106)';
    this.ctx.fillRect(0, 0, 800, 800);
    this.ctx.fillStyle = 'rgb(162, 161, 146)';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(i * 100, j * 100, 100, 100);
        }
      }
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
          if (img) this.ctx.drawImage(img, col * 100, i * 100, 100, 100);
          col++;
        } else {
          col += parseInt(c); // move the column index by the number of empty squares
        }
      }
    }
    this.currentPos = fen;
  }

  private handleClick(x: number, y: number): void {
    const col = Math.floor(x / 100);
    const row = Math.floor(y / 100);
    if (this.selectedPiecePosition.row === -1) {
      this.selectedPiecePosition.row = row;
      this.selectedPiecePosition.col = col;
    } else {
      const move = this.getNewPos(this.selectedPiecePosition.row, this.selectedPiecePosition.col, row, col);
      this.selectedPiecePosition.row = -1;
      this.selectedPiecePosition.col = -1;
      this.loadPosition(move);
    }
  }

  getNewPos(startRow: number, startCol: number, endRow: number, endCol: number): string {
    // convert the current position to an array of rows
    const rows = this.currentPos.split("/");
    // get the piece being moved
    const piece = rows[startRow][startCol];

    if (!this.moveIsValid(piece, startRow, startCol, endRow, endCol)) {
      return this.currentPos;
    }

    // check if the piece being moved is the same color as the player
    if ((piece.toLowerCase() === piece && this.color === "white") || (piece.toUpperCase() === piece && this.color === "black")) {
      return this.currentPos;
    } else {
      this.color = this.color === "white" ? "black" : "white";
    }

    // remove the piece from the starting position
    rows[startRow] = rows[startRow].substr(0, startCol) + "." + rows[startRow].substr(startCol + 1);
    // place the piece in the ending position
    rows[endRow] = rows[endRow].substr(0, endCol) + piece + rows[endRow].substr(endCol + 1);
    // join the rows back into a single string and return the new position
    return rows.join("/");
  }

  moveIsValid(piece: string, startRow: number, startCol: number, endRow: number, endCol: number): boolean {
    let movingDirection: number = piece.toLowerCase() === piece ? 1 : -1;
    // check if the piece is a pawn
    if (piece.toLowerCase() === "p") {
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
        return true;
      }
      return false;
    }
    return true;
  }

  public ngOnDestroy(): void {
  }
}
