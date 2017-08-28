import * as React from 'react';
// import * as $ from 'jquery';
import { Dataset, Column, Data } from './utils';
import './App.css';

let _colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'];
let _files = ['iris.csv', 'abalone.csv', 'cancer.csv', 'fertility.csv', 'parkinsons.csv', 'seeds.csv', 'tissue.csv'];
let _width = 1200;
let _height = 590;
let _radius = 3;
let _start = performance.now();
let _dataset: Dataset;

interface Form {
  file: string;
  scale: boolean;
  hasLabel: boolean;
  colorFeatures: boolean;
}

interface AppState {
  data: Data<number>;
  columns: Array<Column>;
  colorFeatures: boolean;
}

class DeviseApp extends React.Component<{}, AppState> {
  constructor() {
    super();

    this.state = {
      data: [],
      columns: [],
      colorFeatures: true
    };

    this.fetchData('iris.csv', true, true);
  }

  getForm(): Form {
    let file = document.getElementById('file-name') as HTMLInputElement;
    let hasLabel = document.getElementById('has-label') as HTMLInputElement;
    let scale = document.getElementById('scale-data') as HTMLInputElement;
    let color = document.getElementById('color-features') as HTMLInputElement;

    return {
      file: file.value,
      hasLabel: hasLabel.checked,
      scale: scale.checked,
      colorFeatures: color.checked
    };
  }

  componentDidMount() {
    let t = performance.now() - _start;
    console.log('performance: ' + t);
  }

  componentDidUpdate() {
    let t = performance.now() - _start;
    console.log('performance: ' + t);
  }

  fetchData(fileName: string, hasLabel: boolean, scale: boolean) {
    let self = this;
    Dataset.load('data/' + fileName, hasLabel, (ds: Dataset) => {
      _dataset = ds;
      if (scale) { _dataset.scale(); }

      let zero = _dataset.columns.map((_) => { return 0; });
      _dataset.appendDistance(zero);
      
      self.setState({
        data: _dataset.data,
        columns: _dataset.columns
      });
    });
  }

  onChange() {
    _start = performance.now();
    let form = this.getForm();
    this.fetchData(form.file, form.hasLabel, form.scale);
    this.setState({ 
      data: [],
      columns: []
    });
  }

  onColorFeaturesChange(e: React.MouseEvent<HTMLInputElement>) {
    let elem = e.target as HTMLInputElement;
    this.setState({ colorFeatures: elem.checked });
  }

  render() {
    let data = this.state.data;
    var columns = this.state.columns;
    let colorFeatures = this.state.colorFeatures;

    let datasets = _files.map((file: string, i: number) => {
      return <option key={i}>{file}</option>;
    });
    
    let points = data
      .map(function(row: Array<number>, i: number) {
        return (<DataPoint key={i} data={row} columns={columns} colorFeatures={colorFeatures} />); 
      });

    let canvas = <div>Loading...</div>;
    if (points.length > 0) {
      canvas = <svg width={_width} height={_height}>{points}</svg>;
    }

    return (
      <div className="App container">
          <div className="App-header row">
            <div className="col">
              <select id="file-name" onChange={this.onChange.bind(this)}>{datasets}</select>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Has label</span>
                <span className="input-group-addon">
                  <input id="has-label" type="checkbox" onClick={this.onChange.bind(this)} defaultChecked={true}/>
                </span>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Scale data</span>
                <span className="input-group-addon">
                  <input id="scale-data" type="checkbox" onClick={this.onChange.bind(this)} defaultChecked={true}/>
                </span>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Color features</span>
                <span className="input-group-addon">
                  <input id="color-features" type="checkbox" onClick={this.onColorFeaturesChange.bind(this)} defaultChecked={colorFeatures}/>
                </span>
              </div>
            </div>
          </div>
        <div className="row"> {canvas} </div>
      </div>
    );
  }
}

export default DeviseApp;

interface DataPointProps {
  data: Array<number>;
  columns: Array<Column>;
  colorFeatures: boolean;
}

class DataPoint extends React.Component<DataPointProps, {}> {
  render() {
    let data = this.props.data;
    let columns = this.props.columns;
    let colorFeatures = this.props.colorFeatures;
    let yRange = _height * 0.95;
    let xRange = _width * 0.95;
    
    let distance = data[data.length - 1];
    let dc = columns[columns.length - 1];
    let y = ((distance * yRange) / dc.max) + (_radius * 2);
    
    let points: Array<JSX.Element> = [];

    for (let i = 0, j = 0; i < data.length - 1; i++, j++) {
      let n = data[i];
      let col = columns[i];
      let x = 0.0;
      let color = 'black';

      if (!isNaN(n)) {
        x = ((xRange / (col.max - col.min)) * n) + (_radius * 2);
        color = colorFeatures ? _colors[j] : _colors[0];
        if (j >= _colors.length) { j = 0; }
      }

      points[i] = <circle key={i} className="Data-point" r={_radius} cx={x} cy={y} stroke={color} strokeWidth="1"/>;
    }

    return <g>{points}</g>;
  }
}