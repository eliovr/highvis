import * as React from 'react';
import { Dataset, Column, Point, Path, colors as _colors, files as _files } from './utils';
import './App.css';

interface Form {
  file: string;
  scale: boolean;
  sort: string;
  hasLabel: boolean;
  showPath: boolean;
}

interface AppProps {
  width?: number;
  height?: number;
}

interface AppState {
  ds: Dataset;
  sort: string;
  step: number;
  hasLabel: boolean;
  colorLabel: boolean;
}

class SpiralApp extends React.Component<AppProps, AppState> {
  sorting: Array<string>;

  constructor() {
    super();

    this.sorting = ['Variance', 'Correlation'];

    this.state = {
      ds: Dataset.empty(),
      sort: this.sorting[0],
      step: 50,
      hasLabel: true,
      colorLabel: true
    };
  }

  componentDidMount() {
    this.fetchData(_files[0], true, true, this.sorting[0]);
  }
  
  fetchData(fileName: string, hasLabel: boolean, scale: boolean, sort: string) {
    let self = this;
    
    Dataset.fetch('data/' + fileName, hasLabel, (ds: Dataset) => {
      if (scale) { ds.scale(); }
      self.setState({ ds: ds });
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
    this.setState({ ds: Dataset.empty() });
  }

  onScaleChanged(e: React.MouseEvent<HTMLInputElement>) { 
    let scale = (e.target as HTMLInputElement).checked;

    if (scale) {
      this.setState({ ds: this.state.ds.scale() });
    } else {
      this.reloadData();
    }
  }

  onSortChanged(e: React.MouseEvent<HTMLInputElement>) {
    let sort = (e.target as HTMLInputElement).value;
    this.setState({ sort: sort });
  }

  onStepChanged(e: React.ChangeEvent<HTMLInputElement>) {
    let step = (e.target as HTMLInputElement).value;
    this.setState({ step: Number(step) });
  }

  onColorChanged(e: React.MouseEvent<HTMLInputElement>) {
    let color = (e.target as HTMLInputElement).checked;
    this.setState({ colorLabel: color });
  }

  render() {
    let height = this.props.height ? this.props.height : 700;
    let width = this.props.width ? this.props.width : 1200;
    let ds = this.state.ds;
    let sort = this.state.sort;
    let step = this.state.step;
    let hasLabels = this.state.hasLabel;
    let colorLabel = this.state.colorLabel;
    let start: Point = new Point(width / 2, height / 2);
    
    let datasets = _files.map((file: string, i: number) => {
      return <option key={i}>{file}</option>;
    });

    let sortings = this.sorting.map((s: string, i: number) => {
      return <option key={i}>{s}</option>;
    });

    sort === 'Variance' ? 
      ds.sortFeaturesByVariance() :
      ds.sortFeaturesByCorrelation();

    let points = ds.data
      .map(function(row: Array<number>, i: number) {
        let label = hasLabels ? ds.labels[i] : -1;
        return (
          <DataPoint key={i} 
            start={start} 
            data={row} 
            columns={ds.columns} 
            label={label} 
            colorLabel={colorLabel} 
            step={step} />
        ); 
      });

    return (
      <div>
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
        {
          points.length <= 0 ?
            <div>Loading...</div> :
            <svg width={width} height={height}>{points}</svg>
        }
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