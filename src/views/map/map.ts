import * as THREE from 'three';
// @ts-ignore
import * as d3 from 'd3-geo';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

export class ThreeMap {
  container: any = undefined;
  provinceInfo: any = undefined;
  scene: any = undefined;
  camera: any = undefined;
  renderer: any = undefined;
  font: any = undefined;
  map: any = undefined;

  raycaster: any = undefined;
  mouse: any = undefined;
  eventOffset: any = undefined;
  controller: any = undefined;
  private activeInstersect: any;

  constructor(mapId: any, container: any = document.body,) {
    this.container = container;
  }

  init() {
    this.provinceInfo = document.getElementById('provinceInfo');
    //场景
    this.scene = new THREE.Scene();

    // 相机 透视相机
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, -70, 150);
    this.camera.lookAt(0, 0, 0);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  setResize() {
    let _this = this;
    window.addEventListener('resize', function () {
      _this.renderer.setSize(window.innerWidth, window.innerHeight);
    })
  }

  loadMapData() {
    // 加载json文件
    let loader = new THREE.FileLoader();
    loader.load('../../../public/json/china.json', (data: any) => {
      if (data) {
        let jsonData = JSON.parse(data);
        this.initMap(jsonData);
      }
    });
  }

  loadFont() { //加载中文字体
    let loader = new THREE.FontLoader();
    loader.load('../../../public/fonts/chinese.json', (response) => {
      this.font = response;
      this.loadMapData();
    });
  }

  createText(text: string, position: { x: number; y: number; z: number }) {
    let shapes = this.font.generateShapes(text, 1);
    let geometry = new THREE.ShapeBufferGeometry(shapes);
    let material = new THREE.MeshBasicMaterial();
    let textMesh = new THREE.Mesh(geometry, material);
    textMesh.position.set(position.x, position.y, position.z);

    this.scene.add(textMesh);
  }

  initMap(chinaJson: any) {
    // 建一个空对象存放对象
    this.map = new THREE.Object3D();

    // 墨卡托投影转换
    const projection = d3.geoMercator().center([104.0, 37.5]).scale(80).translate([0, 0]);

    chinaJson.features.forEach((elem: any) => {
      // 定一个省份3D对象
      let province: any = new THREE.Object3D();
      // 每个的 坐标 数组
      let coordinates = elem.geometry.coordinates;
      // 循环坐标数组
      coordinates.forEach((multiPolygon: any) => {

        multiPolygon.forEach((polygon: string | any[]) => {
          const shape = new THREE.Shape();
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 'white'
          });
          let lineGeometry: any = new THREE.Geometry();

          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = projection(polygon[i]);
            if (i === 0) {
              shape.moveTo(x, -y);
            }
            shape.lineTo(x, -y);
            lineGeometry.vertices.push(new THREE.Vector3(x, -y, 4.01));
          }

          const extrudeSettings = {
            depth: 4,
            bevelEnabled: false
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const material = new THREE.MeshBasicMaterial({
            color: '#02A1E2',
            transparent: true,
            opacity: 0.6
          });
          const material1 = new THREE.MeshBasicMaterial({
            color: '#3480C4',
            transparent: true,
            opacity: 0.5
          });
          /* const material = new THREE.MeshBasicMaterial({ color: '#dedede', transparent: false, opacity: 0.6 });
          const material1 = new THREE.MeshBasicMaterial({ color: '#dedede', transparent: false, opacity: 0.5 }); */
          const mesh = new THREE.Mesh(geometry, [material, material1]);
          const line = new THREE.Line(lineGeometry, lineMaterial);
          province.add(mesh);
          province.add(line)

        })

      })

      // 将geo的属性放到省份模型中
      province.properties = elem.properties;
      if (elem.properties.contorid) {
        const [x, y] = projection(elem.properties.contorid);
        province.properties._centroid = [x, y];
      }

      this.map.add(province);
    });

    this.scene.add(this.map);
  }

  setRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.eventOffset = {};

    let onMouseMove = (event: { clientX: number; clientY: number; }) => {

      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components

      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.eventOffset.x = event.clientX;
      this.eventOffset.y = event.clientY;
      this.provinceInfo.style.left = this.eventOffset.x + 2 + 'px';
      this.provinceInfo.style.top = this.eventOffset.y + 2 + 'px';
    }

    window.addEventListener('mousemove', onMouseMove, false);
  }

  setLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff); // 环境光
    this.scene.add(ambientLight);
  }

  setController() {
    this.controller = new OrbitControls(this.camera, this.renderer.domElement);
    /* this.controller.enablePan = false; // 禁止右键拖拽
    this.controller.enableZoom = true; // false-禁止右键缩放

    this.controller.maxDistance = 200; // 最大缩放 适用于 PerspectiveCamera
    this.controller.minDistance = 50; // 最大缩放
    this.controller.enableRotate = true; // false-禁止旋转 */

    /* this.controller.minZoom = 0.5; // 最小缩放 适用于OrthographicCamera
    this.controller.maxZoom = 2; // 最大缩放 */

  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    // this.cube.rotation.x += 0.05;
    // this.cube.rotation.y += 0.05;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // calculate objects intersecting the picking ray
    let intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (this.activeInstersect && this.activeInstersect.length > 0) { // 将上一次选中的恢复颜色
      this.activeInstersect.forEach((element: { object: { material: { color: { set: (arg0: string) => void } }[] } }) => {
        element.object.material[0].color.set('#02A1E2');
        element.object.material[1].color.set('#3480C4');
      });
    }

    this.activeInstersect = []; // 设置为空

    for (var i = 0; i < intersects.length; i++) {
      if (intersects[i].object.material && intersects[i].object.material.length === 2) {
        this.activeInstersect.push(intersects[i]);
        intersects[i].object.material[0].color.set(0xff0000);
        intersects[i].object.material[1].color.set(0xff0000);
        break; // 只取第一个
      }
    }
    this.createProvinceInfo();

    this.renderer.render(this.scene, this.camera);
  }

  createProvinceInfo() { // 显示省份的信息
    if (this.activeInstersect.length !== 0 && this.activeInstersect[0].object.parent.properties.name) {
      let properties = this.activeInstersect[0].object.parent.properties;

      this.provinceInfo.textContent = properties.name;

      this.provinceInfo.style.visibility = 'visible';
    } else {
      this.provinceInfo.style.visibility = 'hidden';
    }
  }


}
