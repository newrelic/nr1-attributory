import React from 'react';
import PropTypes from 'prop-types';

export default class Attribute extends React.Component {
  static propTypes = {
    attribute: PropTypes.object,
    searchText: PropTypes.string,
    editHandler: PropTypes.func
  };

  state = {};

  handleEdit = e => {
    e.preventDefault();

    const { attribute, editHandler } = this.props;
    if (editHandler) editHandler(attribute);
  };

  render() {
    const { attribute, searchText } = this.props;

    const re = new RegExp(searchText, 'i');

    return searchText === '' ||
      ('key' in attribute && attribute.key.search(re) > -1) ||
      ('description' in attribute && attribute.description.search(re) > -1) ? (
      <div className="brick">
        <div className="card">
          <div className="c1">{attribute.key}</div>
          <div className="c">{attribute.description}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span className="tag">{attribute.type}</span>
            {attribute.nr && <span className="tag nr">New Relic</span>}
            {!attribute.nr && (
              <a
                href="#"
                className="u-unstyledLink tiny-button"
                onClick={this.handleEdit}
              >
                edit
              </a>
            )}
          </div>
        </div>
      </div>
    ) : null;
  }
}
