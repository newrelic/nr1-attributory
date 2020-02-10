import React from 'react';
import PropTypes from 'prop-types';

import { EntityStorageMutation } from 'nr1';

export default class Editor extends React.PureComponent {
  static propTypes = {
    data: PropTypes.object,
    onClose: PropTypes.func,
  };

  state = {
    description: null
  };

  saveEdit = (e) => {
    e.preventDefault();

    const { description } = this.state;
    const { data, onClose } = this.props;

    EntityStorageMutation.mutate({
      entityGuid: data.entityGuid,
      actionType: EntityStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
      collection: 'attributoryDB',
      documentId: data.eventName + ':' + data.attributeName,
      document: { description },
    }).then(() => {
      this.setState({
        description: null
      }, () => (onClose) ? onClose(data, description) : null);
    });
  }

  delete = (e) => {
    e.preventDefault();

    const { data, onClose } = this.props;

    EntityStorageMutation.mutate({
      entityGuid: data.entityGuid,
      actionType: EntityStorageMutation.ACTION_TYPE.DELETE_DOCUMENT,
      collection: 'attributoryDB',
      documentId: data.eventName + ':' + data.attributeName,
    }).then(() => {
      this.setState({
        description: null
      }, () => (onClose) ? onClose(data, '') : null);
    });
  }

  render() {
    const { data } = this.props;
    const description = (this.state.description === null) ? ((this.props.data || {}).description || '') : this.state.description;

    const leftMargin = {marginLeft: '.1em'};

    const textareaStyle = {
      height: '7.75em',
      border: 'none',
      borderRadius: '6px',
      padding: '.25em',
      marginBottom: '10px  ',
      font: '1.25em/1.5em Inconsolata, monospace',
      boxShadow: '0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2)'
    };

    return (
      <div>
        <h2 className="h2" style={leftMargin}>{data.attributeName}</h2>
        <textarea placeholder="attribute description..." value={description} onChange={e => this.setState({description: e.target.value})} style={textareaStyle}></textarea>
        <div className="editor-buttons">
          <div>
            {
              (((this.props.data || {}).description || '') !== '')
              ? <a href="#" className="tiny-button red" onClick={this.delete} style={leftMargin}>delete</a>
              : <span className="disabled-button">delete</span>
            }
          </div>
          <div>
            {
              (description && description !== (this.props.data || {}).description)
              ? <a href="#" className="tiny-button green" onClick={this.saveEdit} style={leftMargin}>save</a>
              : <span className="disabled-button">save</span>
            }
          </div>
        </div>
      </div>
    );
  }
}
