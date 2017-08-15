import * as React from 'react';
import * as $ from 'jquery';
import './App.css';

var _colorLastFeature = false;
var _skipLastFeature = false;
var _shiftRadius = 50;
var _scaleData = true;
var _sortFeatures = true;
let _colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'];

interface AppState {
  data: Array<Array<number>>;
  features: Array<Feature>;
}

class App extends React.Component<{}, AppState> {
  constructor() {
    super();
    this.state = {
      data: new Array(),
      features: new Array()
    };
    this.fetchData('data/iris.csv');
  }

  dataFeatures(data: Array<Array<number>>): Array<Feature> {
    var columns: Array<Feature> = data[0]
      .map(function(x: number, i: number){
        return new Feature(i);
      });

    data.forEach(function(row: Array<number>){
      row.forEach(function(x: number, i: number){
        columns[i].add(x);
      });
    });

    return columns;
  }

  fetchData(file: string) {
    var self = this;

    $.get(file, function(raw: string){
      var data = raw
        .split(/\r\n|\n/)
        .map(function(line: string){
          return line
            .split(',')
            .map(function(col: string){
              return Number(col);
            });
        });

      // for some reason, last element is always empty.
      data.pop();
      var features = self.dataFeatures(data);
      
      // --------------- Scale data -------------------
      if (_scaleData) {
        data = data.map(function (row: Array<number>){
          return row.map(function (x: number, i: number){
            if (_colorLastFeature && i >= row.length - 1) {
              return x;
            }

            return features[i].scale(x);
          });
        });

        features = self.dataFeatures(data);
      }
      
      // ------------- Sort by variance ----------------
      if (_sortFeatures) {
        data
          .map(function (row: Array<number>) {
            return row.map(function (x: number, i: number){
              return Math.pow(x - features[i].avg(), 2);
            });
          })
          .reduce(function (a: Array<number>, b: Array<number>) {
            return a.map(function (x: number, i: number){
              return x + b[i];
            });
          })
          .forEach(function (x: number, i: number) {
            features[i].variance =  x / (features[i].count - 1);
          });

        features.sort(function (a: Feature, b: Feature) {
          return a.variance - b.variance;
        });
      }

      self.setState({
        data: data,
        features: features
      });
    });
  }

  onDrawPathClicked(e: React.MouseEvent<HTMLInputElement>) {
    let elem = e.target as HTMLInputElement;
    let paths = document.getElementsByTagName('path');
    let visibility = elem.checked ? 'visible' : 'hidden';

    for (var i = 0 ; i < paths.length ; i++) {
      paths[i].style.visibility = visibility;
    }
  }

  onChange() {
    let dataset = this.refs['dataset'] as HTMLInputElement;
    _skipLastFeature = (this.refs['skip-last'] as HTMLInputElement).checked;
    _colorLastFeature = (this.refs['color-last'] as HTMLInputElement).checked;
    _scaleData = (this.refs['scale-data'] as HTMLInputElement).checked;
    _sortFeatures = (this.refs['sort-features'] as HTMLInputElement).checked;
    _shiftRadius = +(this.refs['shift-radius'] as HTMLInputElement).value;
    
    this.fetchData('data/' + dataset.value);
  }

  render() {
    let width = 1600;
    let height = 1000;
    let start: Point = new Point(width / 2, height / 3);

    let features = this.state.features;
    let points = this.state.data
      .map(function(row: Array<number>, i: number) {
        return <DataPoint key={i} start={start} data={row} features={features} />; 
      });

    return (
      <div className="App">
        <div className="App-header">
          <div className="row">
            <div className="col-lg-2">
              <div className="input-group">
                <span className="input-group-addon">Dataset</span>
                <input ref="dataset" type="text" className="form-control" defaultValue="iris.csv" onBlur={this.onChange.bind(this)}/>
              </div>
            </div>
            <div className="col-lg-1">
              <div className="input-group">
                <span className="input-group-addon">Scale data</span>
                <span className="input-group-addon">
                  <input ref="scale-data" type="checkbox" onClick={this.onChange.bind(this)} defaultChecked={true}/>
                </span>
              </div>
            </div>
            <div className="col-lg-2">
              <div className="input-group">
                <span className="input-group-addon">Sort by variance</span>
                <span className="input-group-addon">
                  <input ref="sort-features" type="checkbox" onClick={this.onChange.bind(this)} defaultChecked={true}/>
                </span>
              </div>
            </div>
            <div className="col-lg-2">
              <div className="input-group">
                <span className="input-group-addon">Shift radius</span>
                <input ref="shift-radius" type="number" className="form-control" defaultValue={_shiftRadius + ''} onBlur={this.onChange.bind(this)}/>
              </div>
            </div>
            <div className="col-lg-1">
              <div className="input-group">
                <span className="input-group-addon">Path</span>
                <span className="input-group-addon">
                  <input type="checkbox" onClick={this.onDrawPathClicked}/>
                </span>
              </div>
            </div>
            <div className="col-lg-1">
              <div className="input-group">
                <span className="input-group-addon">Skip last</span>
                <span className="input-group-addon">
                  <input ref="skip-last" type="checkbox" onClick={this.onChange.bind(this)}/>
                </span>
              </div>
            </div>
            <div className="col-lg-1">
              <div className="input-group">
                <span className="input-group-addon">Color last</span>
                <span className="input-group-addon">
                  <input ref="color-last" type="checkbox" onClick={this.onChange.bind(this)}/>
                </span>
              </div>
            </div>
          </div>
        </div>
        <svg width={width} height={height} fill="black">{points}</svg>
      </div>
    );
  }
}

class Feature {
  i: number;
  sum: number;
  count: number;
  min: number;
  max: number;
  categories: Set<string>;
  variance: number;

  constructor(i: number) {
    this.i = i;
    this.sum = 0;
    this.count = 0;
    this.min = Number.MAX_VALUE;
    this.max = Number.MIN_VALUE;
    this.categories = new Set();
    this.variance = NaN;
  }

  isCategorical(): boolean {
    return this.categories.size > 0;
  }

  avg(): number {
    return this.sum / this.count;
  }

  add(x: number) {
    this.sum += x;
    this.count += 1;
    this.min = Math.min(this.min, x);
    this.max = Math.max(this.max, x);
  }

  scale(x: number): number {
    return (x - this.min) / (this.max - this.min);
  }
}

class Path {
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

class Point {
  x: number;
  y: number;

  constructor (x: number, y: number) {
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

interface DataPointProps {
  start: Point;
  data: Array<number>;
  features: Array<Feature>;
}

class DataPoint extends React.Component<DataPointProps, {}> {
  render() {
    let origin = this.props.start.clone();
    let center = new Point(origin.x, origin.y + 10);
    let other = new Point(center.x + 10, center.y);

    let features = this.props.features;
    let data = this.props.data;
    let path = new Path(center);
    let stroke = function(): string {
      if (_colorLastFeature) {
        return _colors[data[data.length - 1] - 1];
      }
      return 'rgba(228, 149, 70, 0.5)';
    }();

    var startAngle = 0.0;
    var angleRange = Math.PI;// * 1.5;
    var angle = 0.0;

    features.forEach(function(f: Feature, i: number) {
      if (_skipLastFeature && f.i >= data.length - 1) { return; }
      
      let x = data[f.i];
      angle = ((angleRange / (f.max - f.min)) * x) + startAngle;

      origin.x = center.x;
      origin.y = center.y;

      center.x = center.x + _shiftRadius * Math.cos(angle);
      center.y = center.y + _shiftRadius * Math.sin(angle);

      other.x = center.x + 10;
      other.y = center.y;

      path.add(center);

      if (i === 0) { angleRange = Math.PI * 0.8; }
      startAngle = center.angle(origin, other);
      startAngle = center.y <= origin.y ? (Math.PI * 0.6) + startAngle : (Math.PI * 0.6) - startAngle;
    });

    let style = {visibility: 'hidden'};

    return (
    <g>
      <circle className="Data-point" cx={center.x} cy={center.y} r={3} stroke={stroke} strokeWidth="1"/>
      <path d={path.toString()} fill="none" strokeWidth="1" stroke={stroke} style={style}/>
    </g>);
  }
}

export default App;
