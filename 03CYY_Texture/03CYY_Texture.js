// Texture.js
 
// 全局变量
var gl;						// WebGL上下文

// 以下全局变量用于控制动画的状态和速度
var angleY = 0.0;		// 绕y轴旋转的角度
var angleX = 0.0;		// 绕x轴旋转的角度
var angleStep = 3.0;	// 角度变化步长(3度)

var program; // shader程序对象
var matProj; // 投影矩阵

// 光源参数
var light = [];
light.light_position = vec4( 0.0, 0.0, 2.0, 1.0 );  // 近距离光源		
light.light_ambient  = vec3( 0.2, 0.2, 0.2 );		// 环境光
light.light_diffuse  = vec3( 1.0, 1.0, 1.0 );		// 漫反射光
light.light_specular = vec3( 1.0, 1.0, 1.0 ); 		// 镜面反射光

/*材质参数*/
var mtlBrass = []; // 黄铜材质
mtlBrass.material_ambient = vec3( 0.329412, 0.223529, 0.027451 ); // 环境光反射系数
mtlBrass.material_diffuse = vec3( 0.780392, 0.568627, 0.113725 ); // 漫反射系数
mtlBrass.material_specular = vec3( 0.992157, 0.941176, 0.807843 );// 镜面反射系数
mtlBrass.material_shininess = 27.897400;	// 高光系数

// 铬材质
var mtlChrome = [];
mtlChrome.material_ambient = vec3( 0.250000, 0.250000, 0.250000 ); // 环境光反射系数
mtlChrome.material_diffuse = vec3( 0.400000, 0.400000, 0.400000 ); // 漫反射系数
mtlChrome.material_specular = vec3( 0.774597, 0.774597, 0.774597 );// 镜面反射系数
mtlChrome.material_shininess = 76.800003;	// 高光系数

// 翡翠材质
var mtlJadeite = [];
mtlJadeite.material_ambient = vec3( 0.021500, 0.174500, 0.021500 ); // 环境光反射系数
mtlJadeite.material_diffuse = vec3( 0.075680, 0.614240, 0.075680 ); // 漫反射系数
mtlJadeite.material_specular = vec3( 0.633000, 0.727811, 0.633000 );// 镜面反射系数
mtlJadeite.material_shininess = 76.800003;	// 高光系数

// 黑曜石材质
var mtlObsidian = [];
mtlObsidian.material_ambient = vec3( 0.053750, 0.050000, 0.066250 ); // 环境光反射系数
mtlObsidian.material_diffuse = vec3( 0.182750, 0.170000, 0.225250 ); // 漫反射系数
mtlObsidian.material_specular = vec3( 0.332741, 0.328634, 0.346435 );// 镜面反射系数
mtlObsidian.material_shininess = 38.400002;	// 高光系数

// 紫罗兰材质
var mtlViolet = [];
mtlViolet.material_ambient = vec3( 0.110000, 0.060000, 0.090000 ); // 环境光反射系数
mtlViolet.material_diffuse = vec3( 0.430000, 0.470000, 0.540000 ); // 漫反射系数
mtlViolet.material_specular = vec3( 0.330000, 0.330000, 0.520000 );// 镜面反射系数
mtlViolet.material_shininess = 22.000000;	// 高光系数

// 定义Cube对象
var Cube = function(){  // 构造函数
	this.numVertices = 36;	// 绘制立方体使用顶点数(6个面*2个三角形*3个顶点)
	this.vertices = [			// 立方体的8个顶点
		vec3(-0.5, -0.5,  0.5), // 左下前
		vec3(-0.5,  0.5,  0.5), // 左上前
		vec3( 0.5,  0.5,  0.5), // 右上前
		vec3( 0.5, -0.5,  0.5), // 右下前
		vec3(-0.5, -0.5, -0.5), // 左下后
		vec3(-0.5,  0.5, -0.5), // 左上后
		vec3( 0.5,  0.5, -0.5), // 右上后
		vec3( 0.5, -0.5, -0.5)  // 右下后
	];
	this.points = new Array(0); // 存放顶点坐标的数组，初始为空
	this.normals = new Array(0);// 存放法向的数组，初始为空
	this.texcoords = new Array(0); //存放纹理坐标的数组，初始为空
	
	
	this.pointBuffer = null;	// 顶点坐标缓冲对象
	this.normalBuffer = null;	// 法向缓冲对象
	this.texBuffer = null;      //纹理坐标缓冲对象
	this.setMaterial(mtlBrass); // 设置材质参数
	
	this.complete = false;  //纹理对象是否初始完成
}

// 生成立方体一个面的顶点坐标和法向数据
// a,b,c,d对应的顶点须为逆时针绕向
Cube.prototype.quad = function(a, b, c, d){
	// 计算四边形的两个不平行的边向量
	var u = subtract(this.vertices[b], this.vertices[a]);
	var v = subtract(this.vertices[c], this.vertices[b]);
		
	// 通过叉乘计算法向
	var normal = normalize(cross(u, v));

	//a，b，c，d逆时针绕向
	this.normals.push(normal); 
	this.texcoords.push(vec2(0.0, 0.0));  //设置纹理坐标
	this.points.push(this.vertices[a]); 
	this.normals.push(normal); 
	this.texcoords.push(vec2(1.0, 0.0));
	this.points.push(this.vertices[b]); 
	this.normals.push(normal); 
	this.texcoords.push(vec2(1.0, 1.0));
	this.points.push(this.vertices[c]); 
	this.normals.push(normal); 
	this.texcoords.push(vec2(0.0, 0.0));
	this.points.push(this.vertices[a]); 
	this.normals.push(normal); 
	this.texcoords.push(vec2(1.0, 1.0));
	this.points.push(this.vertices[c]); 
	this.normals.push(normal); 
	this.texcoords.push(vec2(0.0, 1.0));
	this.points.push(this.vertices[d]); 
}

// 生成立方体的顶点坐标和法向数据
Cube.prototype.genVertices = function(){
	this.quad(1, 0, 3, 2);	// 前
	this.quad(2, 3, 7, 6);	// 右
	this.quad(3, 0, 4, 7);	// 下
	this.quad(6, 5, 1, 2);	// 上
	this.quad(4, 5, 6, 7);	// 后
	this.quad(5, 4, 0, 1);	// 左
}

// 初始化顶点缓冲对象
Cube.prototype.init = function(){
	this.genVertices();	// 生成立方体的顶点坐标和法向数据
	
	/*创建并初始化顶点坐标缓冲区对象(Buffer Object)*/
	// 创建缓冲区对象
	this.pointBuffer = gl.createBuffer(); 
	// 将pointBuffer绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
	// 为Buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(gl.ARRAY_BUFFER,	// Buffer类型
		flatten(this.points),		// 数据来源
		gl.STATIC_DRAW	// 表明是一次提供数据，多遍绘制
		);
	this.points.length = 0;  // 顶点数据已传至GPU端，可释放内存
	this.vertices.length = 0;
	
	/*创建并初始化顶点法向缓冲区对象(Buffer Object)*/
	// 创建缓冲区对象
	this.normalBuffer = gl.createBuffer(); 
	// 将normalBuffer绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
	// 为Buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(gl.ARRAY_BUFFER,	// Buffer类型
		flatten(this.normals),		// 数据来源
		gl.STATIC_DRAW	// 表明是一次提供数据，多遍绘制
		);
	this.normals.length = 0;  // 顶点数据已传至GPU端，可释放内存
	
	
	/*创建并初始化顶点纹理缓冲区对象(Buffer Object)*/
	// 创建缓冲区对象
	this.texBuffer = gl.createBuffer(); 
	// 将texBuffer绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
	// 为Buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(gl.ARRAY_BUFFER,	// Buffer类型
		flatten(this.texcoords),		// 数据来源
		gl.STATIC_DRAW	// 表明是一次提供数据，多遍绘制
		);
	this.texcoords.length = 0;  // 顶点数据已传至GPU端，可释放内存
	
}

//初始化纹理对象
//初始化参数image
Cube.prototype.initTexture = function(img){
	//创建纹理对象
	this.texObj = gl.createTexture();  
	//绑定当前二维纹理对象
	gl.bindTexture(gl.TEXTURE_2D ,this.texObj);
	//设置加载纹理图时沿Y轴翻转
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
	//加载纹理图到显存
	gl.texImage2D(
		gl.TEXTURE_2D,  
		0, 
		gl.RGB, 
		gl.RGB, 
		gl.UNSIGNED_BYTE, 
		img
	);
	
	// 设置对纹理图缩放时采用的插值方式(线性插值)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	this.complete = true; // 纹理对象初始化完成
	
}


// 设置材质
Cube.prototype.setMaterial = function(mtl){
	this.material_ambient = mtl.material_ambient; // 环境光反射系数
	this.material_diffuse = mtl.material_diffuse; // 漫反射系数
	this.material_specular = mtl.material_specular;// 镜面反射系数
	this.material_shininess = mtl.material_shininess;// 高光系数
	
	// 如果program非空，将材质属性传给shader
	if(program){
		var ambient_product = mult(light.light_ambient, this.material_ambient);
		var diffuse_product = mult(light.light_diffuse, this.material_diffuse);
		var specular_product = mult(light.light_specular, this.material_specular);

		gl.uniform3fv(program.u_AmbientProduct, flatten(ambient_product));
		gl.uniform3fv(program.u_DiffuseProduct, flatten(diffuse_product));
		gl.uniform3fv(program.u_SpecularProduct, flatten(specular_product));
		gl.uniform1f(program.u_Shininess, this.material_shininess);
	}
}

// 选用shader program，为attribute变量和光照相关uniform变量提供数据
Cube.prototype.useProgram = function(program){
	gl.useProgram(program);
	
	// 将顶点坐标buffer绑定为当前buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer); 
	// 为顶点属性数组提供数据(数据存放在pointBuffer对象中)
	gl.vertexAttribPointer( 
		program.a_Position,	// 属性变量索引
		3,					// 每个顶点属性的分量个数
		gl.FLOAT,			// 数组数据类型
		false,				// 是否进行归一化处理
		0,   // 在数组中相邻属性成员起始位置间的间隔(以字节为单位)
		0    // 第一个属性值在buffer中的偏移量
		);
	// 为a_Position启用顶点数组
	gl.enableVertexAttribArray(program.a_Position);	
	
	// 将顶点法向buffer绑定为当前buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer); 
	// 为顶点属性数组提供数据(数据存放在normalBuffer对象中)
	gl.vertexAttribPointer( 
		program.a_Normal,	// 属性变量索引
		3,					// 每个顶点属性的分量个数
		gl.FLOAT,			// 数组数据类型
		false,				// 是否进行归一化处理
		0,   // 在数组中相邻属性成员起始位置间的间隔(以字节为单位)
		0    // 第一个属性值在buffer中的偏移量
		);
	// 为a_Position启用顶点数组
	gl.enableVertexAttribArray(program.a_Normal);	
	
	
	// 将顶点纹理坐标buffer绑定为当前buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer); 
	// 为顶点属性数组提供数据(数据存放在texBuffer对象中)
	gl.vertexAttribPointer( 
		program.a_Texcoord,	// 属性变量索引
		2,					// 每个顶点属性的分量个数
		gl.FLOAT,			// 数组数据类型
		false,				// 是否进行归一化处理
		0,          // 在数组中相邻属性成员起始位置间的间隔(以字节为单位)
		0           // 第一个属性值在buffer中的偏移量
	);
	gl.enableVertexAttribArray(program.a_Texcoord);  // 为a_Position启用顶点数组
	
	
	var ambient_product = mult(light.light_ambient, this.material_ambient);
	var diffuse_product = mult(light.light_diffuse, this.material_diffuse);
	var specular_product = mult(light.light_specular, this.material_specular);

	gl.uniform4fv(program.u_LightPosition, flatten(light.light_position));
	gl.uniform3fv(program.u_AmbientProduct, flatten(ambient_product));
	gl.uniform3fv(program.u_DiffuseProduct, flatten(diffuse_product));
	gl.uniform3fv(program.u_SpecularProduct, flatten(specular_product));
	gl.uniform1f(program.u_Shininess, this.material_shininess);
	
	// 本程序只使用了0号纹理单元,其值在整个程序中始终不变
	gl.uniform1i(program.u_Sampler, 0);
}

// 绘制函数
Cube.prototype.draw = function(){
	if(this.complete){   //纹理对象初始化完成
		gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
	}
}

var cube = new Cube();	// 创建一个Cube对象实例

// 页面加载完成后会调用此函数，函数名可任意(不一定为main)
window.onload = function main(){
	// 获取页面中id为webgl的canvas元素
    var canvas = document.getElementById("webgl");
	if(!canvas){ // 获取失败？
		alert("获取canvas元素失败！"); 
		return;
	}
	
	// 利用辅助程序文件中的功能获取WebGL上下文
	// 成功则后面可通过gl来调用WebGL的函数
    gl = WebGLUtils.setupWebGL(canvas);    
    if (!gl){ // 失败则弹出信息
		alert("获取WebGL上下文失败！"); 
		return;
	}        
	
	// 初始化顶点缓冲对象
	cube.init();
	
	//创建一个image对象
	var img = new Image();
	//注册图像加载完成事件的响应函数
	img.onload = function(){
		cube.initTexture(img);
		
		//保证第一次调用render时纹理对象已初始化完毕
		render();   // 进行绘制
		
	}
	//浏览器开始加载图像（异步加载）
	img.src = "box.png";   //文件路径
	
	
	/*设置WebGL相关属性*/
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // 设置背景色为白色
	gl.enable(gl.DEPTH_TEST);	// 开启深度检测
	gl.enable(gl.CULL_FACE);	// 开启面剔除，默认剔除背面
	// 设置视口，占满整个canvas
	gl.viewport(0, 0, canvas.width, canvas.height);
	// 设置投影矩阵：透视投影，根据视口宽高比指定视域体
	matProj = perspective(35.0, 		// 垂直方向视角
		canvas.width / canvas.height, 	// 视域体宽高比
		0.1, 							// 相机到近裁剪面距离
		10.0);							// 相机到远裁剪面距离

	/*加载片元光照shader程序并为shader中attribute变量提供数据*/
	// 加载id分别为"vertex-fShading"和"fragment-fShading"的shader程序，
	// 并进行编译和链接，返回shader程序对象program
    var fProgram = initShaders(gl, "vertex-fShading", 
		"fragment-fShading");
		
	// 获取fProgram中各attribute变量索引
	// 注意getAttribLocation失败则返回-1
	fProgram.a_Position = gl.getAttribLocation(fProgram, "a_Position");
	if(fProgram.a_Position < 0)
		console.log("获取attribute变量a_Position索引失败!");
	
    fProgram.a_Normal = gl.getAttribLocation(fProgram, "a_Normal");
	if(fProgram.a_Normal < 0)
		console.log("获取attribute变量a_Normal索引失败!");
	
	fProgram.a_Texcoord = gl.getAttribLocation(fProgram, "a_Texcoord");
	if(fProgram.a_Texcoord < 0){
		console.log("获取attribute变量a_Texcoord索引失败!");
	}
	
	// 获取vProgram中各uniform变量索引
	// 注意getUniformLocation失败则返回null
	fProgram.u_matModel = gl.getUniformLocation(fProgram, "u_matModel");
	if(!fProgram.u_matModel) 
		console.log("获取uniform变量u_matModel索引失败!");
	
	fProgram.u_matView = gl.getUniformLocation(fProgram, "u_matView");
	if(!fProgram.u_matView)
		console.log("获取uniform变量u_matView索引失败!");
	
	fProgram.u_Projection = gl.getUniformLocation(fProgram, "u_Projection");
	if(!fProgram.u_Projection)
		console.log("获取uniform变量u_Projection索引失败!");
	
	fProgram.u_NormalMat = gl.getUniformLocation(fProgram, "u_NormalMat");
	if(!fProgram.u_NormalMat) 
		console.log("获取uniform变量u_NormalMat索引失败!");
	
	fProgram.u_LightPosition = gl.getUniformLocation(fProgram, "u_LightPosition");
	if(!fProgram.u_LightPosition)
		console.log("获取uniform变量u_LightPosition索引失败!");
	
	fProgram.u_AmbientProduct = gl.getUniformLocation(fProgram, "u_AmbientProduct");
	if(!fProgram.u_AmbientProduct)
		console.log("获取uniform变量u_AmbientProduct索引失败!");
	
	fProgram.u_DiffuseProduct = gl.getUniformLocation(fProgram, "u_DiffuseProduct");
	if(!fProgram.u_DiffuseProduct)
		console.log("获取uniform变量u_DiffuseProduct索引失败!");
	
	fProgram.u_SpecularProduct = gl.getUniformLocation(fProgram, "u_SpecularProduct");
	if(!fProgram.u_SpecularProduct) 
		console.log("获取uniform变量u_SpecularProduct索引失败!");
	
	fProgram.u_Shininess = gl.getUniformLocation(fProgram, "u_Shininess");
	if(!fProgram.u_Shininess)
		console.log("获取uniform变量u_Shininess索引失败!");
	
	fProgram.u_Sampler = gl.getUniformLocation(fProgram, "u_Sampler");
	if(!fProgram.u_Sampler){
		console.log("获取uniform变量u_Sampler索引失败!");
	}
	
	program = fProgram;
	
	// 选用shader program，为attribute变量和光照相关uniform变量提供数据
	cube.useProgram(program);
	
	// 材质菜单响应
	var mtlMenu = document.getElementById("material");
	mtlMenu.onclick = function(){
		switch(mtlMenu.selectedIndex){
			case 0:	// 黄铜材质
				cube.setMaterial(mtlBrass);
				break;
			case 1:	// 铬材质
				cube.setMaterial(mtlChrome);
				break;
			case 2: // 翡翠材质
				cube.setMaterial(mtlJadeite);
				break;
			case 3: // 黑曜石材质
				cube.setMaterial(mtlObsidian);
				break;
			case 4: // 紫罗兰材质
				cube.setMaterial(mtlViolet);
				break;
		}
		requestAnimFrame(render); // 请求重绘
	}
	
	
};

// 绘制函数
function render() {
	// 清颜色缓存和深度缓存
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
	// 创建变换矩阵
	var matView = translate(0.0, 0.0, -3.0);	// 观察矩阵
	// 模型变换矩阵
	var matModel = mult(rotateY(angleY),	    // 绕y轴旋转
		rotateX(angleX));		     		    // 绕x轴旋转
	// 计算法向矩阵
	var matNormal = normalMatrix(mult(matView, matModel));
	
	// 传值给shader中的u_Projection
	gl.uniformMatrix4fv(program.u_Projection, false, flatten(matProj));
	// 传值给shader中的u_matView
	gl.uniformMatrix4fv(program.u_matView, false, flatten(matView));
	// 传值给shader中的u_matModel
	gl.uniformMatrix4fv(program.u_matModel, false, flatten(matModel));
	// 传值给shader中的u_matModel
	gl.uniformMatrix3fv(program.u_NormalMat, false, flatten(matNormal));
	
	cube.draw(); // 绘制立方体
}

// 按键响应
// 用于控制视角
window.onkeydown = function(){
	switch(event.keyCode){
		case 37: // 方向键Left
			angleY -= angleStep;
			if (angleY < -180.0) {
				angleY += 360.0;
			}
			break;
		case 38: // 方向键Up
			angleX -= angleStep;
			if (angleX < -80.0) {
				angleX = -80.0;
			}
			break;
		case 39: // 方向键Right
			angleY += angleStep;
			if (angleY > 180.0) {
				angleY -= 360.0;
			}
			break;
		case 40: // 方向键Down
			angleX += angleStep;
			if (angleX > 80.0) {
				angleX = 80.0;
			}
			break;
		default:
			return;
	}
	requestAnimFrame(render); // 请求重绘
}
