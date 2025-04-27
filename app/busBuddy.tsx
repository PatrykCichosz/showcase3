import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  SafeAreaView,
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  Appearance,
  Modal,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  PanResponder
} from 'react-native'
import MapView, { Polyline, Marker, AnimatedRegion } from 'react-native-maps'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import stopsData from './stops.json'

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
]

interface Stop { stop_id: string; stop_name: string; stop_lat: number; stop_lon: number; stop_code: number; shape_dist_traveled?: number }
interface ShapePoint { shape_pt_lat: number; shape_pt_lon: number; shape_dist_traveled: number }

const BusBuddy: React.FC = () => {
  const [routeInput, setRouteInput] = useState('')
  const [dir, setDir] = useState<'0'|'1'>('0')
  const [shapePoints, setShapePoints] = useState<ShapePoint[]>([])
  const [matchedStops, setMatchedStops] = useState<Stop[]>([])
  const [filteredStops, setFilteredStops] = useState<Stop[]>([])
  const [traveledPoints, setTraveledPoints] = useState<ShapePoint[]>([])
  const [remainingPoints, setRemainingPoints] = useState<ShapePoint[]>([])
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notificationDistance, setNotificationDistance] = useState('2')
  const [isDistanceModalVisible, setIsDistanceModalVisible] = useState(false)
  const [isStopModalVisible, setIsStopModalVisible] = useState(false)
  const [boardingStop, setBoardingStop] = useState<Stop|null>(null)
  const [departureStop, setDepartureStop] = useState<Stop|null>(null)
  const [isTeleporting, setIsTeleporting] = useState(false)
  const [busIcon, setBusIcon] = useState('🚌')
  const [isIconModalVisible, setIsIconModalVisible] = useState(false)
  const [theme, setTheme] = useState<'light'|'dark'>(Appearance.getColorScheme()==='dark'?'dark':'light')
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentCoord, setCurrentCoord] = useState<{latitude:number,longitude:number}|null>(null)
  const mapRef = useRef<MapView|null>(null)
  const journeyRef = useRef<NodeJS.Timeout|null>(null)
  const pan = useRef(new Animated.ValueXY()).current
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:()=>true,
      onPanResponderGrant:()=>{pan.setOffset({x:(pan as any).x._value,y:(pan as any).y._value});pan.setValue({x:0,y:0})},
      onPanResponderMove:Animated.event([null,{dx:pan.x,dy:pan.y}],{useNativeDriver:false}),
      onPanResponderRelease:()=>pan.flattenOffset()
    })
  ).current
  const markerRegion = useRef(
    new AnimatedRegion({latitude:0,longitude:0,latitudeDelta:0,longitudeDelta:0})
  ).current
  const {height} = useWindowDimensions()

  useEffect(()=>{
    Notifications.requestPermissionsAsync().then(({status})=>{if(status!=='granted')alert('Notifications disabled')})
    Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowAlert:true,shouldPlaySound:true,shouldSetBadge:false})})
    AsyncStorage.getItem('favorites').then(json=>{if(json)setFavorites(JSON.parse(json))})
    AsyncStorage.getItem('busIcon').then(icon=>{if(icon)setBusIcon(icon)})
    AsyncStorage.getItem('theme').then(t=>{if(t==='light'||t==='dark')setTheme(t)})
  },[])

  const toRad=(v:number)=>(v*Math.PI)/180
  const toDeg=(v:number)=>(v*180)/Math.PI
  const calcDist=useCallback((lat1:number,lon1:number,lat2:number,lon2:number)=>{
    const R=6371000
    const dLat=toRad(lat2-lat1)
    const dLon=toRad(lon2-lon1)
    const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
  },[])
  const bearing=(lat1:number,lon1:number,lat2:number,lon2:number)=>{
    const dLon=toRad(lon2-lon1)
    const y=Math.sin(dLon)*Math.cos(toRad(lat2))
    const x=Math.cos(toRad(lat1))*Math.sin(toRad(lat2))-
      Math.sin(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(dLon)
    return (toDeg(Math.atan2(y,x))+360)%360
  }

  useEffect(()=>{
    if(boardingStop&&departureStop){
      const startIdx=shapePoints.findIndex(p=>calcDist(p.shape_pt_lat,p.shape_pt_lon,boardingStop.stop_lat,boardingStop.stop_lon)<20)
      const endIdx=shapePoints.findIndex(p=>calcDist(p.shape_pt_lat,p.shape_pt_lon,departureStop.stop_lat,departureStop.stop_lon)<20)
      if(startIdx>=0&&endIdx>=0){
        const [s,e]=startIdx<endIdx?[startIdx,endIdx]:[endIdx,startIdx]
        const segment=shapePoints.slice(s,e+1)
        setRemainingPoints(segment);setTraveledPoints([])
        const sVal=segment[0].shape_dist_traveled||0,eVal=segment[segment.length-1].shape_dist_traveled||0
        setFilteredStops(matchedStops.filter(st=>{const d=st.shape_dist_traveled||0;return d>=sVal&&d<=eVal}))
        const first=segment[0]
        setCurrentCoord({latitude:first.shape_pt_lat,longitude:first.shape_pt_lon})
        markerRegion.setValue({latitude:first.shape_pt_lat,longitude:first.shape_pt_lon,latitudeDelta:0,longitudeDelta:0})
        mapRef.current?.animateCamera({center:{latitude:first.shape_pt_lat,longitude:first.shape_pt_lon},heading:0,pitch:0,zoom:19,altitude:500},{duration:800})
      }
    }
  },[boardingStop,departureStop])

  const loadRoute=async(direction?:'0'|'1')=>{
    setError('');if(journeyRef.current)clearInterval(journeyRef.current)
    setActive(false);setShapePoints([]);setTraveledPoints([]);setRemainingPoints([])
    setMatchedStops([]);setFilteredStops([]);setBoardingStop(null);setDepartureStop(null)
    const useDir=direction??dir
    if(!routeInput){setError('Enter a route number');return}
    setLoading(true)
    try{
      const [rRes,tRes]=await Promise.all([
        fetch('https://raw.githubusercontent.com/PatrykCichosz/proj_json/main/routes.json'),
        fetch('https://raw.githubusercontent.com/PatrykCichosz/proj_json/main/trips.json')
      ])
      const routes=await rRes.json(),trips=await tRes.json()
      const rt=routes.find((r:any)=>r.route_short_name.toString()===routeInput)
      if(!rt){setError('Route not found');return}
      const tp=trips.find((t:any)=>t.route_id===rt.route_id&&t.direction_id.toString()===useDir)
      if(!tp){setError('Trip not found');return}
      const sRes=await fetch(`https://raw.githubusercontent.com/PatrykCichosz/proj_json/main/${tp.shape_id}.json`)
      let sData:ShapePoint[]=await sRes.json()
      sData=sData.filter(p=>p.shape_pt_lat&&p.shape_pt_lon)
      if(!sData.length){setError('No shape points');return}
      setShapePoints(sData);setRemainingPoints(sData);setTraveledPoints([]);setActive(false)
      const first=sData[0]
      setCurrentCoord({latitude:first.shape_pt_lat,longitude:first.shape_pt_lon})
      markerRegion.setValue({latitude:first.shape_pt_lat,longitude:first.shape_pt_lon,latitudeDelta:0,longitudeDelta:0})
      mapRef.current?.animateCamera({center:{latitude:first.shape_pt_lat,longitude:first.shape_pt_lon},heading:0,pitch:0,zoom:19,altitude:500},{duration:800})
      const latMin=Math.min(...sData.map(p=>p.shape_pt_lat))-0.005,latMax=Math.max(...sData.map(p=>p.shape_pt_lat))+0.005
      const lonMin=Math.min(...sData.map(p=>p.shape_pt_lon))-0.005,lonMax=Math.max(...sData.map(p=>p.shape_pt_lon))+0.005
      const stops=stopsData.reduce<Stop[]>((acc,st)=>{
        if(st.stop_lat<latMin||st.stop_lat>latMax||st.stop_lon<lonMin||st.stop_lon>lonMax)return acc
        let best:null|{dist:number;traveled:number}=null
        for(let pt of sData){
          const d=calcDist(st.stop_lat,st.stop_lon,pt.shape_pt_lat,pt.shape_pt_lon)
          if(!best||d<best.dist)best={dist:d,traveled:pt.shape_dist_traveled}
        }
        if(best&&best.dist<20){st.shape_dist_traveled=best.traveled;acc.push(st)}
        return acc
      },[])
      stops.sort((a,b)=>(a.shape_dist_traveled||0)-(b.shape_dist_traveled||0))
      setMatchedStops(stops);setFilteredStops(stops)
    }catch{setError('Failed to load route')}finally{setLoading(false)}
  }

  const startJourney=(skipCamera=false)=>{
    if(!remainingPoints.length)return
    setActive(true)
    if(!skipCamera){
      const first=remainingPoints[0],next=remainingPoints[1]||first
      const br=bearing(first.shape_pt_lat,first.shape_pt_lon,next.shape_pt_lat,next.shape_pt_lon)
      mapRef.current?.animateCamera({center:{latitude:first.shape_pt_lat,longitude:first.shape_pt_lon},heading:br,pitch:60,zoom:19,altitude:500},{duration:800})
    }
    journeyRef.current=setInterval(()=>{
      setRemainingPoints(prev=>{
        if(prev.length<=1){clearInterval(journeyRef.current!);setActive(false);return []}
        const [np,...rest]=prev
        setTraveledPoints(t=>[...t,np])
        setCurrentCoord({latitude:np.shape_pt_lat,longitude:np.shape_pt_lon})
        markerRegion.timing({latitude:np.shape_pt_lat,longitude:np.shape_pt_lon,duration:800}).start()
        const look=rest[0]||np,br2=bearing(np.shape_pt_lat,np.shape_pt_lon,look.shape_pt_lat,look.shape_pt_lon)
        mapRef.current?.animateCamera({center:{latitude:np.shape_pt_lat,longitude:np.shape_pt_lon},heading:br2,pitch:60,zoom:19,altitude:500},{duration:800})
        return rest
      })
    },800)
  }

  const stopJourney=()=>{
    if(journeyRef.current)clearInterval(journeyRef.current)
    setActive(false)
    setTraveledPoints([])
    setRemainingPoints(shapePoints)
    setFilteredStops(matchedStops)
  }

  const notifyStopsAway=()=>{
    const dist=parseInt(notificationDistance)
    if(filteredStops.length<dist)return
    const dest=filteredStops[filteredStops.length-dist]
    if(journeyRef.current)clearInterval(journeyRef.current)
    const idx=remainingPoints.findIndex(p=>calcDist(p.shape_pt_lat,p.shape_pt_lon,dest.stop_lat,dest.stop_lon)<20)
    if(idx<0)return
    const before=remainingPoints.slice(0,idx),after=remainingPoints.slice(idx)
    setTraveledPoints(prev=>[...prev,...before])
    setRemainingPoints(after)
    setIsTeleporting(true)
    const trans=800
    markerRegion.timing({latitude:dest.stop_lat,longitude:dest.stop_lon,duration:trans}).start()
    mapRef.current?.animateCamera({center:{latitude:dest.stop_lat,longitude:dest.stop_lon},heading:0,pitch:60,zoom:19,altitude:500},{duration:trans})
    setTimeout(async()=>{
      await Notifications.scheduleNotificationAsync({content:{title:'Bus Buddy',body:`You are ${dist} stops away!`},trigger:null})
      setTimeout(()=>{setIsTeleporting(false);startJourney(true)},2000)
    },trans)
  }

  const toggleDirection=()=>{const nd=dir==='0'?'1':'0';setDir(nd);loadRoute(nd)}
  const toggleTheme=()=>{
    const nt=theme==='dark'?'light':'dark'
    setTheme(nt)
    AsyncStorage.setItem('theme', nt)
  }

  const saveRoute=()=>{
    if(!favorites.includes(routeInput)){
      const u=[...favorites,routeInput]
      setFavorites(u)
      AsyncStorage.setItem('favorites',JSON.stringify(u))
    }
  }
  const removeRoute=(r:string)=>{
    const u=favorites.filter(f=>f!==r)
    setFavorites(u)
    AsyncStorage.setItem('favorites',JSON.stringify(u))
  }
  const selectFavorite=(v:string)=>{
    setRouteInput(v)
    setTimeout(()=>loadRoute(),300)
  }

  const startId = boardingStop?.stop_id ?? filteredStops[0]?.stop_id ?? matchedStops[0]?.stop_id
  const endId = departureStop?.stop_id ?? filteredStops[filteredStops.length-1]?.stop_id ?? matchedStops[matchedStops.length-1]?.stop_id

  return (
    <SafeAreaView style={{flex:1,backgroundColor:theme==='dark'?'#121212':'#f4f4f4'}}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        customMapStyle={theme==='dark'?darkMapStyle:[]}
      >
        <Polyline coordinates={traveledPoints.map(p=>({latitude:p.shape_pt_lat,longitude:p.shape_pt_lon}))} strokeWidth={6} strokeColor="#2196f3"/>
        <Polyline coordinates={remainingPoints.map(p=>({latitude:p.shape_pt_lat,longitude:p.shape_pt_lon}))} strokeWidth={6} strokeColor="#ffc107"/>
        {filteredStops.map(stop=>(
          <Marker key={stop.stop_id} coordinate={{latitude:stop.stop_lat,longitude:stop.stop_lon}} pinColor={
            stop.stop_id===startId?'#4caf50':
            stop.stop_id===endId?'#f44336':'#9c27b0'
          }/>
        ))}
        <Marker.Animated coordinate={markerRegion} anchor={{x:0.5,y:0.5}}>
          <Text style={{fontSize:32}}>{busIcon}</Text>
        </Marker.Animated>
      </MapView>
      {isTeleporting && (
        <View style={styles.teleportOverlay}>
          <ActivityIndicator size="large" color="#fff"/>
        </View>
      )}
      <Animated.View {...panResponder.panHandlers} style={[styles.panel,{backgroundColor:theme==='dark'?'#1e1e1e':'#ffffff',paddingBottom:height*0.02},{transform:pan.getTranslateTransform()}]}>
        <FlatList horizontal data={favorites} keyExtractor={item=>item} renderItem={({item})=>(
          <View style={{flexDirection:'row',alignItems:'center'}}>
            <Pressable onPress={()=>selectFavorite(item)} style={[styles.button,{backgroundColor:'#00796b'}]}>
              <Text style={styles.text}>{item}</Text>
            </Pressable>
            <Pressable onPress={()=>removeRoute(item)} style={styles.removeBadge}>
              <Text style={styles.removeText}>×</Text>
            </Pressable>
          </View>
        )}/>
        <TextInput value={routeInput} onChangeText={setRouteInput} placeholder="Enter Route" placeholderTextColor="#888" style={[styles.input,{backgroundColor:theme==='dark'?'#333':'#eee',color:theme==='dark'?'#fff':'#000'}]}/>
        <View style={styles.row}>
          <Pressable onPress={()=>loadRoute()} style={[styles.button,{backgroundColor:'#00796b'}]}>
            {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.text}>Load</Text>}
          </Pressable>
          <Pressable onPress={saveRoute} style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>★</Text>
          </Pressable>
          <Pressable onPress={toggleDirection} style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>{dir==='0'?'Out':'In'}</Text>
          </Pressable>
          <Pressable onPress={()=>startJourney()} disabled={active} testID="startJourneyButton" style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>▶</Text>
          </Pressable>
          <Pressable onPress={stopJourney} disabled={!active} style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>■</Text>
          </Pressable>
          <Pressable onPress={()=>setIsDistanceModalVisible(true)} style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>🔢</Text>
          </Pressable>
          <Pressable onPress={()=>setIsStopModalVisible(true)} style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>Stops</Text>
          </Pressable>
          <Pressable onPress={notifyStopsAway} style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>🔔</Text>
          </Pressable>
          <Pressable onPress={()=>setIsIconModalVisible(true)} style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>Icon</Text>
          </Pressable>
          <Pressable onPress={toggleTheme} style={[styles.button,{backgroundColor:'#00796b'}]}>
            <Text style={styles.text}>{theme==='dark'?'☀️':'🌙'}</Text>
          </Pressable>
        </View>
        <Text style={styles.selected}>From: {filteredStops.find(s=>s.stop_id===startId)?.stop_name} ({filteredStops.find(s=>s.stop_id===startId)?.stop_code})</Text>
        <Text style={styles.selected}>To: {filteredStops.find(s=>s.stop_id===endId)?.stop_name} ({filteredStops.find(s=>s.stop_id===endId)?.stop_code})</Text>
        {error && <Text style={[styles.error,{color:'#ff5252'}]}>{error}</Text>}
      </Animated.View>
      <Modal visible={isDistanceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent,{backgroundColor:theme==='dark'?'#1e1e1e':'#fff'}]}>
            {['1','2','3','4','5'].map(v=>(
              <Pressable key={v} onPress={()=>{setNotificationDistance(v);setIsDistanceModalVisible(false)}} style={[styles.modalButton,{backgroundColor:'#00796b'}]}>
                <Text style={styles.text}>{v} stops</Text>
              </Pressable>
            ))}
            <Pressable onPress={()=>setIsDistanceModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.text}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={isStopModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent,{backgroundColor:theme==='dark'?'#1e1e1e':'#fff'}]}>
            <FlatList data={matchedStops} keyExtractor={i=>i.stop_id} renderItem={({item})=>(
              <Pressable onPress={()=>{
                if(!boardingStop||(boardingStop&&departureStop)){setBoardingStop(item);setDepartureStop(null)}
                else if(!departureStop&&item.stop_id!==boardingStop.stop_id){setDepartureStop(item)}
              }} style={[styles.modalButton,{backgroundColor:
                item.stop_id===startId?'#4caf50':
                item.stop_id===endId?'#f44336':'#00796b'
              }]}>
                <Text style={styles.text}>{item.stop_name} ({item.stop_code})</Text>
              </Pressable>
            )}/>
            <Pressable onPress={()=>{
              setBoardingStop(null)
              setDepartureStop(null)
              setFilteredStops(matchedStops)
              setRemainingPoints(shapePoints)
              setTraveledPoints([])
            }} style={styles.modalClose}>
              <Text style={styles.text}>Reset</Text>
            </Pressable>
            <Pressable onPress={()=>setIsStopModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.text}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={isIconModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent,{backgroundColor:theme==='dark'?'#1e1e1e':'#fff'}]}>
            {['🚌','🚍','🚎','🚐','🚚','🚗'].map(icon=>(
              <Pressable key={icon} onPress={()=>{
                setBusIcon(icon)
                AsyncStorage.setItem('busIcon', icon)
                setIsIconModalVisible(false)
              }} style={[styles.modalButton,{backgroundColor:'#00796b'}]}>
                <Text style={{fontSize:32}}>{icon}</Text>
              </Pressable>
            ))}
            <Pressable onPress={()=>setIsIconModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.text}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles=StyleSheet.create({
  panel:{position:'absolute',left:20,right:20,borderRadius:16,padding:12,elevation:6,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:6,bottom:20},
  row:{flexDirection:'row',flexWrap:'wrap',marginTop:8,justifyContent:'center'},
  button:{borderRadius:8,paddingVertical:10,paddingHorizontal:14,margin:6,minWidth:48,alignItems:'center'},
  text:{color:'#fff',fontSize:14,fontWeight:'600'},
  input:{borderRadius:8,paddingHorizontal:12,fontSize:16,height:44,marginBottom:6},
  error:{textAlign:'center',marginTop:6,fontSize:14},
  selected:{textAlign:'center',marginTop:4,fontSize:16,color:'#00796b'},
  removeBadge:{position:'absolute',top:-6,right:-6,backgroundColor:'#e53935',borderRadius:10,width:20,height:20,alignItems:'center',justifyContent:'center'},
  removeText:{color:'#fff',fontSize:12,fontWeight:'bold'},
  modalOverlay:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.4)'},
  modalContent:{padding:20,borderTopLeftRadius:16,borderTopRightRadius:16,maxHeight:'60%'},
  modalButton:{padding:14,borderRadius:8,marginVertical:4,alignItems:'center'},
  modalClose:{padding:14,borderRadius:8,marginTop:12,alignItems:'center',backgroundColor:'#e53935'},
  teleportOverlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.6)',justifyContent:'center',alignItems:'center'}
})

export default BusBuddy
