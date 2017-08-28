import * as $ from 'jquery';

export type Row<T> = Array<T>;
export type Data<T> = Array<Row<T>>;

export class Column {
  i: number;
  sum: number;
  count: number;
  min: number;
  max: number;
  variance: number;

  constructor(i: number) {
    this.i = i;
    this.sum = 0;
    this.count = 0;
    this.min = Number.MAX_VALUE;
    this.max = Number.MIN_VALUE;
    this.variance = NaN;
  }

  avg(): number {
    return this.sum / this.count;
  }

  add(x: number) {
    this.count += 1;

    if (!isNaN(x)) {
      this.sum += x;
      this.min = Math.min(this.min, x);
      this.max = Math.max(this.max, x);
    }
  }

  scale(x: number): number {
    return (x - this.min) / (this.max - this.min);
  }
}

interface Relation {
  a: Column;
  b: Column;
  value: number;
}

export class Dataset {
  data: Data<number>;
  columns: Array<Column>;
  labels: Array<number>;
  correlations: Array<Relation>;
  covariances: Array<Relation>;

  /** Loads a comma-separated CSV file and instantiates a Dataset object
   * which is given as a parameter to the callback function.
   */
  static load(url: string, lastIsLabel: boolean, callback: (_: Dataset) => void) {
    let sep = ',';

    $.get(url, function (raw: string) {
      let rows = raw.split(/\r\n|\n/);
      let columns: Array<Column> = [];
      let labels: Array<number> = [];
      let first = rows[0].split(sep);
      let n = lastIsLabel ? first.length - 1 : first.length;

      for (let i = 0; i < n; i++) {
        columns.push(new Column(i));
      }

      // For some reason, last row is always empty.
      rows.pop();

      let data: Data<number> = rows
        .map(function (line: string) {
          let row = line.split(sep);

          if (lastIsLabel) {
            labels.push(Number(row.pop()));
          }
          
          return row
            .map(function (s: string, i: number) {
              let x = Number(s);
              columns[i].add(x);
              return x;
            });
        });

      callback(new Dataset(data, columns, labels));
    });
  }

  hasLabels(): boolean {
    return this.labels.length > 0;
  }

  /**
   * Sorts data features given the comparison function between columns of the dataset.
   * @param compareFn Comparison function with which columns are sorted.
   */
  sortFeatures(compareFn: (a: Column, b: Column) => number) {
    this.columns.sort(compareFn);
    let columns = this.columns;

    for (let i = 0; i < this.data.length; i++) {
      let row = this.data[i];
      let sorted: Array<number> = [];
      for (let j = 0; j < columns.length; j++) {
        let col = columns[j];
        sorted[j] = row[col.i];
      }
      this.data[i] = sorted;
    }

    for (let i = 0; i < this.columns.length; i++) {
      this.columns[i].i = i;
    }
  }

  /** Sort data features/columns by variance (least to most). */
  sortFeaturesByVariance() {
    this.computeVariances();
    this.sortFeatures((a: Column, b: Column) => {
      return a.variance - b.variance;
    });
  }

  sortFeaturesByCorrelation() {
    let indexes: Array<number> = [];
    let correlations = this.getCorrelations();

    correlations.sort((a: Relation, b: Relation): number => {
      return a.value - b.value;
    });

    for (let i = 0; i < correlations.length; i++) {
      let corr = correlations[i];
      let a = corr.a;
      let b = corr.b;

      if (indexes.indexOf(a.i) < 0) {
        indexes.push(a.i);
      }
      if (indexes.indexOf(b.i) < 0) {
        indexes.push(b.i);
      }
    }

    for (let i = 0; i < this.data.length; i++) {
      let row = this.data[i];
      let sorted: Array<number> = [];
      for (let j = 0; j < indexes.length; j++) {
        let col = indexes[j];
        sorted[j] = row[col];
      }
      this.data[i] = sorted;
    }

    for (let i = 0; i < this.columns.length; i++) {
      this.columns[i].i = indexes[i];
    }
  }

  /** Scales all attributes except labels. */
  scale() {
    let columns = this.columns;
    let scaledColumns: Array<Column> = columns
      .map((c: Column) => {
        return new Column(c.i);
      });

    for (let i = 0; i < this.data.length; i++) {
      let row = this.data[i];

      for (let j = 0; j < row.length; j++) {
        let sx = columns[j].scale(row[j]);
        scaledColumns[j].add(sx);
        row[j] = sx;
      }
    }
    
    this.columns = scaledColumns;
  }

  /**
   * Computes the variance for each feature / column. 
   */
  computeVariances() {
    let columns = this.columns;
    let allNaN = this.columns.every((c: Column) => {
      return isNaN(c.variance);
    });

    if (allNaN) {
      this.data
        .map((row: Array<number>) => {
          return row.map((x: number, i: number) => {
            return Math.pow(x - columns[i].avg(), 2);
          });
        })
        .reduce((a: Array<number>, b: Array<number>) => {
          return a.map((x: number, i: number) => {
            return x + b[i];
          });
        })
        .forEach((x: number, i: number) => {
          columns[i].variance = x / (columns[i].count - 1);
        });
    }
  }

  getCovariances(): Array<Relation> {
    if (this.covariances.length <= 0) {
      let n = this.data.length;
      let columns = this.columns;
      let ci = 0;
      let covariances: Array<Relation> = [];

      // Instantiate relations.
      for (let i = 0; i < columns.length - 1; i++) {
        let a = columns[i];
        for (let ii = i + 1; ii < columns.length; ii++) {
          let b = columns[ii];
          covariances.push({ a: a, b: b, value: 0.0 });
        }
      }

      for (let i = 0; i < this.data.length; i++) {
        let row = this.data[i];

        for (let j = 0; j < row.length - 1; j++) {
          let a = row[j];
          let mua = columns[j].avg();

          for (let jj = j + 1; jj < row.length; jj++) {
            let b = row[jj];
            let mub = columns[jj].avg();
            covariances[ci].value += ((a - mua) * (b - mub) / n);
            ci++;
          }
        }
        ci = 0;
      }
      this.covariances = covariances;
    }

    return this.covariances;
  }

  /** 
   * Appends a new column with Eucledian distance of each row 
   * to the given point 'p'. 
   */
  appendDistance(p: Row<number>) {
    let column = new Column(this.columns.length);
    this.columns.push(column);

    for (var i = 0; i < this.data.length; i++) {
      let row = this.data[i];
      let distance = this.eucledian(row, p);
      row.push(distance);
      column.add(distance);
    }
  }

  getCorrelations(): Array<Relation> {
    if (this.correlations.length <= 0) {
      this.computeVariances();
      this.getCovariances();
      let n = this.data.length;

      for (var i = 0; i < this.covariances.length; i++) {
        var cov = this.covariances[i];
        let ssxx = n * cov.a.variance;
        let ssyy = n * cov.b.variance;
        let ssxy = n * cov.value;
        this.correlations[i] = {
          a: cov.a,
          b: cov.b,
          value: (ssxy * ssxy) / (ssxx * ssyy)
        };
      }
    }
    
    return this.correlations;
  }

  private constructor(data: Data<number>, columns: Array<Column>, labels: Array<number>) {
    this.data = data;
    this.columns = columns;
    this.labels = labels;
    this.correlations = [];
    this.covariances = [];
  }

  private eucledian(a: Row<number>, b: Row<number>): number {
    if (a.length !== b.length) {
      console.error('Rows must have same length to calculate distance.');
      return -1;
    }

    let distance = 0.0;
    for (var i = 0; i < a.length; i++) {
      distance += Math.pow(a[i] - b[i], 2);
    }

    return Math.sqrt(distance);
  }
}

export class Path {
  d: Array<string>;

  constructor(start: Point) {
    this.d = new Array('M' + start.x + ' ' + start.y);
  }

  add(p: Point) {
    this.d.push('L' + p.x + ' ' + p.y);
  }

  toString(): string {
    return this.d.reduce(function (a: string, b: string) {
      return a + ' ' + b;
    });
  }
}

export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  distance(p: Point): number {
    return Math.sqrt(Math.pow((this.x - p.x), 2) + Math.pow((this.y - p.y), 2));
  }

  angle(b: Point, c: Point): number {
    let a = this;
    let ab = a.distance(b);
    let ac = a.distance(c);
    let bc = b.distance(c);

    return Math.acos(((ab * ab) + (ac * ac) - (bc * bc)) / (2 * ab * ac));
  }

  clone(): Point {
    return new Point(this.x, this.y);
  }
}

// function factorial(n: number): number {
//     let f=1;
//     for (let i = 2; i <= n; i++) {
//       f = f * i;
//     }
//     return f;
// }