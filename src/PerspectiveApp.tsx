import * as React from 'react';
import { 
  Dataset, 
  Column, 
  Point,
  Path, 
  files as _files } from './utils';
import './App.css';

interface AppProps {
  width?: number;
  height?: number;
}

interface AppState {
  ds: Dataset;
}

class DeviseApp extends React.Component<AppProps, AppState> {
  selectData: HTMLSelectElement | null;
  inputScale: HTMLInputElement | null;
  inputHasLabel: HTMLInputElement | null;
  inputP: HTMLInputElement | null;

  constructor() {
    super();

    this.state = {
      ds: Dataset.empty()
    };
  }

  componentDidMount() {
    this.fetchData(_files[0], true, true, 2.0);
  }

  fetchData(fileName: string, hasLabel: boolean, scale: boolean, p: number) {
    let self = this;
    Dataset.fetch('data/' + fileName, hasLabel, (ds: Dataset) => {
      if (scale) { ds.scale(); }
      let zero = ds.columns.map((_) => { return 0; });
      ds.addDistanceTo(p, zero);
      
      self.setState({ ds: ds });
    });
  }

  onChange() {
    if (
      this.selectData && 
      this.inputHasLabel && 
      this.inputScale && 
      this.inputP
    ) {
        this.fetchData(
          this.selectData.value, 
          this.inputHasLabel.checked, 
          this.inputScale.checked,
          +this.inputP.value);

        this.setState({ ds: Dataset.empty() });
      }
  }

  render() {
    let height = this.props.height ? this.props.height : 700;
    let width = this.props.width ? this.props.width : 1200;
    let ds = this.state.ds;

    let datasets = _files.map((file: string, i: number) => {
      return <option key={i}>{file}</option>;
    });

    let yRange = height * 0.95;
    let xRange = width * 0.95;
    
    let points = ds.data
      .map(function(row: Array<number>, i: number) {
        return (
          <DataPoint 
            key={i} 
            data={row} 
            columns={ds.columns}
            width={xRange}
            height={yRange} />
        ); 
      });

    return (
      <div>
          <div className="App-header row">
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Data</span>
                <select ref={s => this.selectData = s} onChange={_ => this.onChange()}>{datasets}</select>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">p</span>
                <input ref={e => this.inputP = e} type="number" onChange={_ => this.onChange()} min="0.0" step="0.1" defaultValue="2.0"/>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Has label</span>
                <span className="input-group-addon">
                  <input ref={i => this.inputHasLabel = i} type="checkbox" onClick={_ => this.onChange()} defaultChecked={true}/>
                </span>
              </div>
            </div>
            <div className="col">
              <div className="input-group">
                <span className="input-group-addon">Scale data</span>
                <span className="input-group-addon">
                  <input ref={i => this.inputScale = i} type="checkbox" onClick={_ => this.onChange()} defaultChecked={true}/>
                </span>
              </div>
            </div>
          </div>
        <div>
        {
          points.length <= 0 ?
            <div>Loading...</div> :
            <svg width={width} height={height}>{points}</svg>
        }
        </div>
      </div>
    );
  }
}

export default DeviseApp;

interface DataPointProps {
  data: Array<number>;
  columns: Array<Column>;
  width: number;
  height: number;
}

class DataPoint extends React.Component<DataPointProps, {}> {
  render() {
    let data = this.props.data;
    let columns = this.props.columns;
    let canvasWidth = this.props.width;
    let canvasHeight = this.props.height;
    
    let dist = data[data.length - 1];
    let dc = columns[columns.length - 1];
    let base = (canvasHeight * .9 * (dist - dc.min)) / (dc.max - dc.min);
    let width = (canvasWidth * (dist - dc.min)) / (dc.max - dc.min);
    let height = 70;
    let stepX = width / columns.length;
    let path = new Path();

    for (let i = 0; i < data.length - 1; i++) {
      let n = data[i];
      let col = columns[i];
      let x = stepX * i + 50;
      let y = base;

      if (!isNaN(n)) {
        y += (height * (n - col.min)) / (col.max - col.min);
      }

      path.add(new Point(x, y));
    }

    return <path d={path.toString()} strokeWidth="1" stroke="rgba(255, 45, 0, 0.2)" fill="none" />;
  }
}