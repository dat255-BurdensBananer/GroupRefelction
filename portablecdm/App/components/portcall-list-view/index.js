import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    updatePortCalls,
    selectPortCall,
    toggleFavoritePortCall,
    toggleFavoriteVessel,
    toggleUpdatedPortCall,
    removeAllUpdatedPortCalls,
    appendPortCalls,
    bufferPortCalls,
    setError,
 } from '../../actions';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Alert,
    Modal,
    TouchableOpacity,
} from 'react-native';

import {
    SearchBar,
    Button,
    List,
    ListItem,
    Icon,

} from 'react-native-elements';

import colorScheme from '../../config/colors';
import TopHeader from '../top-header-view';
import { getDateTimeString } from '../../util/timeservices';
import LocationFilter from './sections/locationFilter';

const STAGES = [
    'PLANNED',
    'ARRIVED',
    'BERTHED',
    'ANCHORED',
    'UNDER_WAY',
    'SAILED',
];

class PortCallList extends Component {
  constructor(props) {
      super(props)
    this.state = {
        searchTerm: '',
        refreshing: false,
        numLoadedPortCalls: 20,
        showLocationModal: false,
        stages: this.props.filters.stages,
        all: true,
        planned: false,
        under_way: false,
        berthed: false,
    }
    this.showLocationModal = this.showLocationModal.bind(this);
    this.hideLocationModal = this.hideLocationModal.bind(this);
  }

    showLocationModal() {
        this.setState({showLocationModal: true});
    }

    hideLocationModal() {
        this.setState({showLocationModal: false});
    }

    setModalStagesVisible(visible) {
        this.setState({ modalStagesVisible: visible });
    }

    componentWillMount() {
        this.loadPortCalls = this.loadPortCalls.bind(this);
        this._appendPortCalls = this._appendPortCalls.bind(this);
        this.loadPortCalls()
            .then(this.props.bufferPortCalls);
    }

    loadPortCalls() {
        return this.props.updatePortCalls().then(() => {
            if(this.props.error.hasError) {
                navigate('Error');
            }
        });
    }

    _appendPortCalls() {
        let { portCalls, appendPortCalls, isAppendingPortCalls } = this.props;
        if (portCalls.length > 0 && !isAppendingPortCalls) {
            return appendPortCalls(portCalls[portCalls.length - 1]);
        }
    }

    checkBottom(event){
         let {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
         const paddingToBottom = 100;
         if(!this.props.showLoadingIcon && layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            let numLoaded = this.state.numLoadedPortCalls;

             this.setState({numLoadedPortCalls: numLoaded + 20});
             let { portCalls, appendPortCalls } = this.props;
             if(numLoaded >= portCalls.length) {
                this._appendPortCalls();
             } else {
                 console.log('Loading more local port calls. Showing ' + numLoaded + ' of ' + portCalls.length + ' port calls.');
             }
         }
    }


    render() {
        const {navigation, showLoadingIcon, portCalls, selectPortCall, filters} = this.props;
        const {navigate} = navigation;
        const {searchTerm} = this.state;

        // Quick fix for having 1 element with null value
        if (portCalls.length === 1) {
            portCalls.splice(0,1);
        }

        return(
            <View style={styles.container}>
                <TopHeader title="My Port calls" navigation={this.props.navigation} firstPage/>

              {/*Button to unmark all updated portcalls*/}
                <View style={styles.containerClearButton}>
                  <Button
                      containerViewStyle={styles.buttonContainer}
                      small
                      icon={{
                        name: 'clear',
                        size: 30,
                        color: colorScheme.primaryTextColor,
                    }}
                    title="Unmark all"
                    backgroundColor = {colorScheme.primaryColor}
                    onPress= {() => {
                      Alert.alert(
                        'Mark all portcalls as read',
                        'Are you sure?',
                      [
                        {text:'Yes', onPress: () => {
                            this.props.removeAllUpdatedPortCalls();
                        }
                      },
                      {text:'Cancel'}
                      ]
                    );
                  }
                }
                  />
                  <Button
                      containerViewStyle={styles.buttonContainer}
                      small
                      icon={{
                          name: 'edit-location',
                          size: 30,
                          color: colorScheme.primaryTextColor,
                          style: styles.iconStyle,
                      }}
                      title="Locations"
                      backgroundColor = {colorScheme.primaryColor}
                      onPress= {this.showLocationModal}
                  />
                  <Button
                      containerViewStyle={styles.buttonContainer}
                      small
                      icon={{
                          name: 'filter-list',
                          size: 30,
                          color: colorScheme.primaryTextColor,
                          style: styles.iconStyle,
                      }}
                      title="Filter"
                      backgroundColor = {colorScheme.primaryColor}
                      onPress= {() => navigate('FilterMenu')}
                  />
              </View>

                {/*Render the search/filters header*/}
              <View style={styles.containerRow}>
                  <SearchBar
                      autoCorrect={false}
                      containerStyle = {styles.searchBarContainer}
                      showLoadingIcon={showLoadingIcon}
                      clearIcon
                      inputStyle = {{backgroundColor: colorScheme.primaryContainerColor}}
                      lightTheme
                      placeholder='Search by name, IMO or MMSI number'
                      placeholderTextColor = {colorScheme.tertiaryTextColor}
                      onChangeText={text => this.setState({searchTerm: text})}
                      textInputRef='textInput'
                  />


              </View>

              {/*Create buttons for stages*/}
             <View style={styles.containerClearButton}>
              <TouchableOpacity
                style={ this.state.all ? styles.activeTabContainer : styles.tabContainer}
                activeOpacity = { .5 }
                onPress={() => {
                  this.setState({all: true,planned:false,berthed:false,under_way:false});
                  let prev = this.state.stages;
                  if(!prev.includes("PLANNED"))
                  prev.push("PLANNED");
                  if(!prev.includes("SAILED"))
                  prev.push("SAILED");
                  if(!prev.includes("ANCHORED"))
                  prev.push("ANCHORED");
                  if(!prev.includes("UNDER_WAY"))
                  prev.push("UNDER_WAY");
                  if(!prev.includes("BERTHED"))
                  prev.push("BERTHED");
                  if(!prev.includes("ARRIVED"))
                  prev.push("ARRIVED");

                  this.setState({stages: prev});
                }}
                  >

              <Text style={styles.TextStyle}> All </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={this.state.planned ? styles.activeTabContainer : styles.tabContainer}
                activeOpacity = { .5 }
                onPress={() => {
                    this.setState({all: false,planned:true,berthed:false,under_way:false});
                      let prev = this.state.stages;

                      prev.splice(prev.indexOf("SAILED"), 1);
                      prev.splice(prev.indexOf("ARRIVED"), 1);
                      prev.splice(prev.indexOf("UNDER_WAY"), 1);
                      prev.splice(prev.indexOf("BERTHED"), 1);
                      prev.splice(prev.indexOf("ANCHORED"), 1);

                      if(!prev.includes("PLANNED")){
                      prev.push("PLANNED");
                    }

                  this.setState({stages: prev});
                  }
                }
                  >


              <Text style={styles.TextStyle}> Planned </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={this.state.under_way ? styles.activeTabContainer : styles.tabContainer}
                activeOpacity = { .5 }
                onPress={() => {
                  this.setState({all: false,planned:false,berthed:false,under_way:true});

                  let prev = this.state.stages;

                  prev.splice(prev.indexOf("SAILED"), 1);
                  prev.splice(prev.indexOf("ARRIVED"), 1);
                  prev.splice(prev.indexOf("PLANNED"), 1);
                  prev.splice(prev.indexOf("BERTHED"), 1);
                  prev.splice(prev.indexOf("ANCHORED"), 1);

                  if(!prev.includes("UNDER_WAY")){
                  prev.push("UNDER_WAY");
                }

              this.setState({stages: prev});
              }
                }
                  >

              <Text style={styles.TextStyle}> Under way </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={this.state.berthed ? styles.activeTabContainer : styles.tabContainer}
                activeOpacity = { .5 }
                onPress={() => {
                  this.setState({all: false,planned:false,berthed:true,under_way:false});
                  let prev = this.state.stages;

                  prev.splice(prev.indexOf("SAILED"), 1);
                  prev.splice(prev.indexOf("ARRIVED"), 1);
                  prev.splice(prev.indexOf("UNDER_WAY"), 1);
                  prev.splice(prev.indexOf("PLANNED"), 1);
                  prev.splice(prev.indexOf("ANCHORED"), 1);

                  if(!prev.includes("BERTHED")){
                  prev.push("BERTHED");
                }

              this.setState({stages: prev});
              }
                }
                  >

              <Text style={styles.TextStyle}> Berthed </Text>
              </TouchableOpacity>


          </View>

                {/*Render the List of PortCalls*/}
                <ScrollView
                    refreshControl={
                        <RefreshControl
                        refreshing={this.state.refreshing}
                        onRefresh={this.loadPortCalls.bind(this)}
                    />
                    }
                    onScroll={this.checkBottom.bind(this)}
                    scrollEventThrottle={4}
                    >
                    <List>
                        {
                            this.search(portCalls, searchTerm).map( (portCall) => (
                                <ListItem
                                    roundAvatar
                                    avatar={portCall.vessel.photoURL ? {uri: portCall.vessel.photoURL} : null}
                                    key={portCall.portCallId}
                                    title={portCall.vessel.name}
                                    badge={{element: this.renderFavorites(portCall)}}
                                    titleStyle={styles.titleStyle}
                                    subtitle={getDateTimeString(new Date(portCall.startTime))}
                                    subtitleStyle={styles.subTitleStyle}
                                    // rightTitle={portCall.stage ? portCall.stage.replace(/_/g, ' ') : undefined}
                                    // rightTitleStyle={[styles.subTitleStyle, {fontSize: 9}]}
                                    onPress={() => {
                                        //console.log(JSON.stringify(portCall.vessel));
                                        selectPortCall(portCall);
                                        if(this.props.updatedPortCalls.includes(portCall.portCallId)){
                                        this.props.toggleUpdatedPortCall(portCall.portCallId);
                                      }
                                       navigate('TimeLine')
                                    }}

                                    onLongPress={() => {
                                        Alert.alert(
                                            'Favorite ' + portCall.vessel.name,
                                            'What would you like to do?',
                                            [
                                                {text: 'Cancel'},

                                               /*{
                                                    text:
                                                        (this.props.favoriteVessels.includes(portCall.vessel.imo) ? 'Unf' : 'F') +
                                                        'avorite vessel',
                                                    onPress: () => {
                                                        this.props.toggleFavoriteVessel(portCall.vessel.imo);
                                                        this.props.updatePortCalls();
                                                }},*/

                                                {
                                                    text:
                                                        (this.props.favoritePortCalls.includes(portCall.portCallId) ? 'Unf' : 'F') +
                                                    'avorite port call', onPress: () => {
                                                    this.props.toggleFavoritePortCall(portCall.portCallId);
                                                }},
                                                {
                                                    text:
                                                        (this.props.updatedPortCalls.includes(portCall.portCallId) ? 'Mark portcall as ' : 'Mark portcall as un') +
                                                        'read', onPress: () => {
                                                    this.props.toggleUpdatedPortCall(portCall.portCallId);
                                                }}
                                            ]
                                        );
                                    }}
                                />
                            ))
                        }
                    </List>
                </ScrollView>
                <Modal
                    visible={this.state.showLocationModal}
                    onRequestClose={this.hideLocationModal}
                    transparent={false}
                    animationType='slide'
                >
                    <LocationFilter onBackPress={this.hideLocationModal}/>
                </Modal>
            </View>
        );
    }

    isActive(tabName){
      return tabName == this.state.activeTabName;
    }

    activeTab(tabName){
      this.setState({activeTab: tabName});
    }

    renderFavorites(portCall) {
        let showStar = this.props.favoritePortCalls.includes(portCall.portCallId);
        let showBoat = this.props.favoriteVessels.includes(portCall.vessel.imo);
        let showWarning = this.props.updatedPortCalls.includes(portCall.portCallId);
        return (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {showStar && <Icon
                        name='star'
                        color='gold'
                    />}
                    {showBoat && <Icon
                        name='directions-boat'
                        color='lightblue'
                    />}
                        {showWarning && <Icon
                            name='fiber-new'
                            color='red'
                        />}
                    {!!portCall.stage && <Text style={[styles.subTitleStyle, {fontSize: 9, marginLeft: 4}]}>
                        {portCall.stage.replace(/_/g, ' ')}
                    </Text>}
                </View>
        );
    }

    isFavorite(portCall) {
        return this.props.favoritePortCalls.includes(portCall.portCallId) ||
        this.props.favoriteVessels.includes(portCall.vessel.imo);
      //  ||  this.props.updatedPortCalls.includes(portCall.portCallId);
    }

    sortFilters(a,b) {
        let aFav = this.isFavorite(a);
        let bFav = this.isFavorite(b);
        if (aFav && !bFav) return -1;
        if (bFav && !aFav) return 1;

        let { filters } = this.props;
        let invert = filters.order === 'ASCENDING';
        if (filters.sort_by === 'LAST_UPDATE') {
            if (a.lastUpdated > b.lastUpdated)
                 return invert ? 1 : -1;
            else return invert ? -1 : 1;
        } else if (filters.sort_by === 'ARRIVAL_DATE') {
            if (a.startTime > b.startTime)
                 return invert ? 1 : -1;
            else return invert ? -1 : 1;
        }

        return 0;
    }

    search(portCalls, searchTerm) {
        let { filters } = this.props;

        return portCalls.filter(portCall => {
            return (portCall.vessel.name.toUpperCase().includes(searchTerm.toUpperCase()) ||
            portCall.vessel.imo.split('IMO:')[1].startsWith(searchTerm) ||
            portCall.vessel.mmsi.split('MMSI:')[1].startsWith(searchTerm)) &&
            (!portCall.stage || filters.stages.includes(portCall.stage));
        }).sort((a,b) => this.sortFilters(a,b))//.sort((a,b) => a.status !== 'OK' ? -1 : 1)
        .slice(0, this.state.numLoadedPortCalls);
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorScheme.primaryColor
    },
    // Search bar and filter button
    containerRow: {
        flexDirection: 'row',
        alignItems:'center',
        marginTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
    },
    containerClearButton: {
        flexDirection: 'row',
        alignItems:'flex-start',
        marginTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
    },
    searchBarContainer: {
        backgroundColor: colorScheme.primaryColor,
        flex: 4,
        marginRight: 0,
        borderBottomWidth: 0,
        borderTopWidth: 0,
    },
    // Filter button container
    buttonContainer: {
        flex: 1,
        marginRight: 0.5,
        marginLeft: 0.5,
        alignSelf: 'stretch',
        borderColor: 'white',
        borderWidth: 1,
    },
    iconStyle: {
        alignSelf: 'stretch',
    },
    titleStyle: {
        color: colorScheme.quaternaryTextColor,
    },
    subTitleStyle: {
        color: colorScheme.tertiaryTextColor,
    },
    tabContainer: {
      flex: 1,
      backgroundColor: colorScheme.primaryColor,
      borderColor: 'white',
      borderRadius: 10,
      borderWidth: 1,
      marginRight: 0,
      marginLeft: 0,
      //marginTop: 2,
      marginBottom: 1,
      padding: 5,
      alignSelf: 'stretch',
    },
    activeTabContainer: {
      flex: 1,
      backgroundColor: colorScheme.secondaryColor,
      borderColor: 'white',
      borderRadius: 10,
      borderWidth: 1,
      marginRight: 0,
      marginLeft: 0,
    //  marginTop: 2,
      marginBottom: 1,
      padding: 5,
      alignSelf: 'stretch',
    },
    TextStyle:{
    color:'#fff',
    textAlign:'center',
    },
})

function mapStateToProps(state) {
    return {
        portCalls: state.cache.portCalls,
        cacheLimit: state.cache.limit,
        favoritePortCalls: state.favorites.portCalls,
        favoriteVessels: state.favorites.vessels,
        showLoadingIcon: state.portCalls.portCallsAreLoading,
        filters: state.filters,
        error: state.error,
        updatedPortCalls: state.updated.portCalls,
        isAppendingPortCalls: state.cache.appendingPortCalls
    }
}

export default connect(mapStateToProps, {
    updatePortCalls,
    appendPortCalls,
    selectPortCall,
    toggleFavoritePortCall,
    toggleFavoriteVessel,
    toggleUpdatedPortCall,
    removeAllUpdatedPortCalls,
    bufferPortCalls,
    setError,
})(PortCallList);
