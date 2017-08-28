import * as React from 'react';
import { Dataset, Column, Data, Point, Path } from './utils';
import './App.css';

let _width = 1200;
let _height = 600;
let _colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'];
let _files = ['iris.csv', 'abalone.csv', 'cancer.csv', 'fertility.csv', 'parkinsons.csv', 'seeds.csv', 'tissue.csv'];
let _sorting = ['Variance', 'Correlation'];
let _dataset: Dataset;

interface Form {
  file: string;
  scale: boolean;
  sort: string;
  hasLabel: boolean;
  showPath: boolean;
}

interface AppState {
  data: Data<number>;
  columns: Array<Column>;
  step: number;
  hasLabel: boolean;
  colorLabel: boolean;
}

class SpiralApp extends React.Component<{}, AppState> {
  constructor() {
    super();

    this.state = {
      data: [],
      columns: [],
      step: 50,
      hasLabel: true,
      colorLabel: true
    };

    this.fetchData(_files[0], true, true, _sorting[0]);
  }
  
  fetchData(fileName: string, hasLabel: boolean, scale: boolean, sort: string) {
    let self = this;
    
    Dataset.load('data/' + fileName, hasLabel, (ds: Dataset) => {
      _dataset = ds;
      if (scale) { _dataset.scale(); }

      if (sort === 'Correlation') {
        _dataset.sortFeaturesByCorrelation();
      } else {
        _dataset.sortFeaturesByVariance();
      }
      // if (sort) { _dataset.sortFeaturesByVariance(); }
      // if (sort) { _dataset.sortFeaturesByCorrelation(); }

      self.setState({
        data: _dataset.data,
        columns: _dataset.columns
      });
    });
  }

  getForm(): Form {
    let file = document.getElementById('file-name') as HTMLInputElement;
    let hasLabel = document.getElementById('has-label') as HTMLInputElement;
    let scale = document.getElementById('scale-data') as HTMLInputElement;
    let sort = document.getElementById('sort-data') as HTMLInputElement;
    let showPath = document.getElementById('show-path') as HTMLInputElement;

    return {
      file: file.value,
      hasLabel: hasLabel.checked,
      scale: scale.checked,
      sort: sort.value,
      showPath: showPath.checked
    };
  }

  onPathChanged(e: React.MouseEvent<HTMLInputElement>) {
    let elem = e.target as HTMLInputElement;
    let paths = document.getElementsByTagName('path');
    let visibility = elem.checked ? 'visible' : 'hidden';

    for (var i = 0 ; i < paths.length ; i++) {
      paths[i].style.visibility = visibility;
    }
  }

  reloadData() {
    let form = this.getForm();
    this.fetchData(form.file, form.hasLabel, form.scale, form.sort);
    this.setState({ data: [], columns: [] });
  }

  onScaleChanged(e: React.MouseEvent<HTMLInputElement>) {
    let scale = (e.target as HTMLInputElement).checked;

    if (scale) {
      _dataset.scale();
      this.setState({ 
        data: _dataset.data,
        columns: _dataset.columns
      });
    } else {
      this.reloadData();
    }
  }

  onSortChanged(e: React.MouseEvent<HTMLInputElement>) {
    let sort = (e.target as HTMLInputElement).value;

    if (sort === 'Correlation') {
      _dataset.sortFeaturesByCorrelation();
    } else { 
      _dataset.sortFeaturesByVariance();
    }

    this.setState({ 
      data: _dataset.data, 
      columns: _dataset.columns 
    });
  }

  onStepChanged(e: React.ChangeEvent<HTMLInputElement>) {
    let elem = e.target as HTMLInputElement;
    this.setState({ step: Number(elem.value) });
  }

  onColorChanged(e: React.MouseEvent<HTMLInputElement>) {
    let elem = e.target as HTMLInputElement;
    this.setState({ colorLabel: elem.checked });
  }

  render() {
    let start: Point = new Point(_width / 2, _height / 2);
    let data = this.state.data;
    let columns = this.state.columns;
    let step = this.state.step;
    let hasLabels = this.state.hasLabel;
    let colorLabel = this.state.colorLabel;
    
    let datasets = _files.map((file: string, i: number) => {
      return <option key={i}>{file}</option>;
    });

    let sortings = _sorting.map((s: string, i: number) => {
      return <option key={i}>{s}</option>;
    });

    let points = data
      .map(function(row: Array<number>, i: number) {
        let label = hasLabels ? _dataset.labels[i] : -1;
        return (<DataPoint key={i} 
          start={start} 
          data={row} 
          columns={columns} 
          label={label} 
          colorLabel={colorLabel} 
          step={step} />); 
      });

    var canvas = <div>Loading...</div>;
    if (points.length > 0) {
      canvas = <svg width={_width} height={_height}>{points}</svg>;
    }

    return (
      <div className="App">
        <div className="App-header">
          <div className="row">
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Data</span>
                <select id="file-name" onChange={this.reloadData.bind(this)}>{datasets}</select>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Scale data</span>
                <span className="input-group-addon">
                  <input id="scale-data" type="checkbox" onClick={this.onScaleChanged.bind(this)} defaultChecked={true}/>
                </span>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Sort by</span>
                <select id="sort-data" onChange={this.onSortChanged.bind(this)}>{sortings}</select>
                  {/* <input id="sort-data" type="checkbox" onClick={this.onSortChanged.bind(this)} defaultChecked={true}/> */}
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Step</span>
                <input id="step" type="number" className="form-control" defaultValue={step + ''} onBlur={this.onStepChanged.bind(this)}/>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Show path</span>
                <span className="input-group-addon">
                  <input id="show-path" type="checkbox" onClick={this.onPathChanged}/>
                </span>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Has label</span>
                <span className="input-group-addon">
                  <input id="has-label" type="checkbox" onClick={this.reloadData.bind(this)} defaultChecked={true}/>
                </span>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Color label</span>
                <span className="input-group-addon">
                  <input id="color-label" type="checkbox" onClick={this.onColorChanged.bind(this)} defaultChecked={true}/>
                </span>
              </div>
            </div>
          </div>
        </div>
        {canvas}
      </div>
    );
  }
}

interface DataPointProps {
  start: Point;
  data: Array<number>;
  columns: Array<Column>;
  label: number;
  colorLabel: boolean;
  step: number;
}

class DataPoint extends React.Component<DataPointProps, {}> {
  render() {
    let start = this.props.start;
    let data = this.props.data;
    let columns = this.props.columns;
    let step = this.props.step;
    let label = this.props.label;
    let colorLabel = this.props.colorLabel;

    let origin = start.clone();
    let center = new Point(origin.x, origin.y + 10);
    let other = new Point(center.x + 10, center.y);

    let path = new Path(center);
    let stroke = label >= 0 && colorLabel ? 
      _colors[label] : 
      _colors[0];
    
    let startAngle = 0.0;
    let angleRange = Math.PI;
    let angle = 0.0;

    for (let i = 0; i < data.length; i++) {
      let col = columns[i];
      let x = data[i];
      
      angle = ((angleRange / (col.max - col.min)) * x) + startAngle;

      origin.x = center.x;
      origin.y = center.y;

      center.x = center.x + step * Math.cos(angle);
      center.y = center.y + step * Math.sin(angle);

      other.x = center.x + 10;
      other.y = center.y;

      path.add(center);

      if (i === 0) { angleRange = Math.PI * 0.8; }
      startAngle = center.angle(origin, other);
      startAngle = center.y <= origin.y ? 
        (Math.PI * 0.6) + startAngle : 
        (Math.PI * 0.6) - startAngle;
    }

    let style = {visibility: 'hidden'};

    return (
    <g>
      <circle className="Data-point" cx={center.x} cy={center.y} r={3} stroke={stroke} strokeWidth="1"/>
      <path d={path.toString()} fill="none" strokeWidth="1" stroke={stroke} style={style}/>
    </g>);
  }
}

export default SpiralApp;