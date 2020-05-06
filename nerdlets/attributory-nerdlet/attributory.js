/* eslint-disable no-nested-ternary */
import React from 'react';
import PropTypes from 'prop-types';
import { NerdGraphQuery, EntityStorageQuery, Modal } from 'nr1';

import NRAttributes from './nr-attribs.json';
import SearchIcon from './search-icon.svg';

import Event from './event';
import Editor from './editor';

export default class Attributory extends React.Component {
  static propTypes = {
    launcherUrlState: PropTypes.object,
    // eslint-disable-next-line react/no-unused-prop-types
    nerdletUrlState: PropTypes.object
  };

  state = {
    entityGuid: ((this.props || {}).nerdletUrlState || {}).entityGuid,
    searchText: '',
    editModal: {
      mounted: false,
      hidden: true,
      data: {
        entityGuid: null,
        eventName: null,
        attributeName: null,
        description: null
      }
    }
  };

  componentDidMount() {
    this.getEntityData();
  }

  nrAttributes = {};

  getEntityData = async () => {
    const { entityGuid } = this.state;

    const query = `{ actor { entity(guid: "${entityGuid}") { name accountId domain } } }`;
    const entityData = await NerdGraphQuery.query({ query });
    const entity = (((entityData || {}).data || {}).actor || {}).entity;
    // eslint-disable-next-line no-console
    if (!entity) return console.error('Entity not found!');

    const { accountId, domain, name } = entity;

    const [events, nrAttribs] =
      domain === 'APM'
        ? [['Transaction', 'TransactionError'], NRAttributes.APM]
        : domain === 'BROWSER'
        ? [
            [
              'PageAction',
              'BrowserInteraction',
              'PageView',
              'AjaxRequest',
              'BrowserTiming',
              'JavaScriptError'
            ],
            NRAttributes.Browser
          ]
        : domain === 'MOBILE'
        ? [
            [
              'MobileSession',
              'MobileCrash',
              'MobileRequestError',
              'MobileRequest',
              'Mobile',
              'MobileHandledException'
            ],
            NRAttributes.Mobile
          ]
        : [[], null];

    if (!events.length)
      // eslint-disable-next-line no-console
      return console.error(
        'This type of entity is not supported in Attributory!'
      );

    this.nrAttributes = nrAttribs;

    this.setState(
      {
        accountId,
        // eslint-disable-next-line react/no-unused-state
        entityName: name,
        // eslint-disable-next-line react/no-unused-state
        entityDomain: domain,
        entityEvents: events.map(e => ({ name: e, display: true }))
      },
      () => this.getAttributes()
    );
  };

  getAttributes = async () => {
    const { accountId, entityGuid, entityEvents } = this.state;

    const { timeRange } = this.props.launcherUrlState;
    const timePeriod = timeRange
      ? `SINCE ${
          timeRange && timeRange.duration
            ? `${timeRange.duration / 1000} SECONDS AGO`
            : `${timeRange.begin_time} UNTIL ${timeRange.end_time}`
        }`
      : '';

    const nrqlArray = entityEvents.map(
      e =>
        `${e.name}: nrql(query: "SELECT keySet() FROM ${e.name} WHERE entityGuid = '${entityGuid}' ${timePeriod} LIMIT MAX") {results}`
    );
    const query = `{actor {account(id: ${accountId}) {${nrqlArray.join(
      ' '
    )}}}}`;

    const keysData = await NerdGraphQuery.query({ query: query });
    const keys = (((keysData || {}).data || {}).actor || {}).account || {};

    const dataStore = await EntityStorageQuery.query({
      entityGuid: entityGuid,
      collection: 'attributoryDB'
    });
    const storedData = (dataStore || {}).data || [];
    const stored = storedData.reduce((acc, cur) => {
      const keys = cur.id.split(':');
      if (
        keys.length > 1 &&
        'document' in cur &&
        'description' in cur.document
      ) {
        const evt = keys.shift();
        if (!(evt in acc)) acc[evt] = {};
        acc[evt][keys.join(':')] = cur.document.description;
      }
      return acc;
    }, {});

    const attributes = entityEvents.reduce((acc, evt) => {
      const results =
        evt.name in keys && 'results' in keys[evt.name]
          ? keys[evt.name].results.map(result =>
              result.key in this.nrAttributes[evt.name]
                ? {
                    key: result.key,
                    type: result.type,
                    description: this.nrAttributes[evt.name][result.key],
                    nr: true
                  }
                : evt.name in stored && result.key in stored[evt.name]
                ? {
                    key: result.key,
                    type: result.type,
                    description: stored[evt.name][result.key]
                  }
                : result
            )
          : [];
      if (
        results.length &&
        !(results.length === 1 && results[0].key === 'timestamp')
      )
        acc[evt.name] = results;
      return acc;
    }, {});

    this.setState({ attributes });
  };

  filterEvent = (e, attrib) => {
    e.preventDefault();
    const { entityEvents } = this.state;

    this.setState({
      entityEvents: entityEvents.map(e => {
        if (e.name === attrib) e.display = !e.display;
        return e;
      })
    });
  };

  searchFor = e => {
    this.setState({
      searchText: e.target.value
    });
  };

  showEdit = (evt, attr) => {
    const { entityGuid } = this.state;
    this.setState({
      editModal: {
        mounted: true,
        hidden: false,
        data: {
          entityGuid: entityGuid,
          eventName: evt,
          attributeName: attr.key,
          description: 'description' in attr ? attr.description : ''
        }
      }
    });
  };

  closeEdit = (data, description) => {
    const { attributes } = this.state;

    if (data)
      attributes[data.eventName] = attributes[data.eventName].map(attr => {
        if (attr.key === data.attributeName)
          attr.description = description || '';
        return attr;
      });

    this.setState({
      attributes,
      editModal: {
        mounted: true,
        hidden: true,
        data: {
          entityGuid: null,
          eventName: null,
          attributeName: null,
          description: null
        }
      }
    });
  };

  unmountEdit = () => {
    this.setState({
      editModal: {
        mounted: false,
        hidden: true,
        data: {
          entityGuid: null,
          eventName: null,
          attributeName: null,
          description: null
        }
      }
    });
  };

  render() {
    const { searchText, attributes, entityEvents, editModal } = this.state;

    const searchStyle = {
      fontSize: '16px',
      border: '2px solid #eee',
      padding: '12px 12px 12px 48px',
      fontFamily: 'Inconsolata'
    };

    return (
      <div style={{ backgroundColor: 'white', padding: '1em' }}>
        <h1 className="h1">Attributory</h1>
        <h2 className="h2">Attributes Dictionary</h2>
        <div className="filters">
          <div className="text-filter">
            <img src={SearchIcon} className="icon" />
            <input
              type="text"
              placeholder="search"
              value={searchText}
              className="search"
              style={searchStyle}
              onChange={this.searchFor}
            />
          </div>
          <div className="events-filter">
            {entityEvents &&
              entityEvents.map(e => (
                <a
                  href="#"
                  key={`filter-${e.name}`}
                  className={`${e.display ? 'on' : 'off'}`}
                  onClick={evt => this.filterEvent(evt, e.name)}
                >
                  {e.name}
                </a>
              ))}
          </div>
        </div>
        <div className="attribs-info">
          <span className="tag nr">New Relic</span> marked attributes are
          built-in New Relic attributes
        </div>
        {entityEvents &&
          attributes &&
          entityEvents.map(e => (
            <Event
              event={e.name}
              show={e.display}
              attributes={attributes[e.name] || []}
              searchText={searchText}
              editHandler={this.showEdit}
              key={e.name}
            />
          ))}
        {editModal && editModal.mounted && (
          <Modal
            hidden={editModal.hidden}
            onClose={this.closeEdit}
            onHideEnd={this.unmountEdit}
          >
            <Editor data={editModal.data} onClose={this.closeEdit} />
          </Modal>
        )}
      </div>
    );
  }
}
