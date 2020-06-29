// MovingCamera.js
 
// 全局变量
var gl;						// WebGL上下文
var mvpStack = [];  // 模视投影矩阵栈，用数组实现，初始为空
var matProj;	    // 投影矩阵
var a_Position;  	// shader中attribute变量a_Position的索引
var u_MVPMatrix;	// Shader中uniform变量"u_MVPMatrix"的索引

//地面变量
var sizeGround = 20.0;   //正方形地面的边长的一半
var numVerticesGround;   //地面顶点个数
var bufferGround;        //存放地面顶点数据的buffer对象

//放球
var numSpheres = 50;   //场景中球的数目
var posSphere = [];    //用于保存球位置的数组，对每个球位置保存其x,z坐标
var numVerticesSphere;  //一个球的顶点数
var bufferSphere;      //存放球顶点数据的buffer对象

//原点前方旋转的球
var yRot = 0.0;  //用于动画的旋转角
var deltaAngle = 60.0;  //每秒旋转的角速度

//原点前方旋转的圆环
var numVerticesTorus;   //圆环顶点数
var bufferTorus;        //存放圆环顶点数组的buffer对象

//相机漫游（保存照相机变换矩阵）
var mvpStack = [];   //模视投影矩阵栈，用数组实现，初始为空
var matProj;         //投影矩阵
var matCamera = mat4();   //相机变化，初始值为恒等矩阵

//用于碰撞
//var matReverse = mat4(); // 照相机变换的逆变换，初始为恒等矩阵

//用于保存W S A D四个方向键的按键状态的数组
var keyDown = [false,false,false,false];

//跳跃
var g = 9.8;	      //重力加速度
var v = 4;            //初速度 
var t = 0;			  //从跳跃开始经历的时间
var s = 0;          	//当前跳跃的高度(距离)
var isJumping = false;	    // 是否处于跳跃过程中

//蹲下
var c_g = -9.8;	      //重力加速度
var c_v = -4;            //初速度 
var c_t = 0;			  //从蹲开始经历的时间
var c_s = 0;          	//当前蹲的高度(距离)
var isSquatDown = false;	    // 是否处于蹲过程中

//在y=0平面绘制中心点在原点的格状方形地面
//fExtent:决定地面区域大小（方形地面边长的一半）
//fStep:决定线之间的间隔
//返回用于保存地面顶点数据的数组
function buildGround(fExtent,fStep){
	var ptGround = [];    //用于保存地面顶点数据的数组
	numVerticesGround = 0;
	
	for(var iLine = -fExtent;iLine<=fExtent;iLine +=fStep){
		//z方向线段
		ptGround.push(vec3(iLine,0,fExtent));
		ptGround.push(vec3(iLine,0,-fExtent));
		//x方向
		ptGround.push(vec3(fExtent,0,iLine));
		ptGround.push(vec3(-fExtent,0,iLine));
		
		numVerticesGround += 4;
	}
	return ptGround;
};

//初始化地面缓冲对象（VBO）
function intitGround(){
	var ptGround = buildGround(sizeGround,1.0);  //构建地面网络
	
	/*创建并初始化一个缓冲对象（buffer Object）*/
	//创建缓冲区对象，存于变量bufferGround中
	bufferGround = gl.createBuffer();
	//将bufferGround绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferGround);
	//为buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(
		gl.ARRAY_BUFFER,      //buffer类型
		flatten(ptGround),    //数据来源
		gl.STATIC_DRAW        //表明是一次提供数据，多遍绘制
	);
	ptGround.length = 0;    //顶点数据已传至GPU端，可释放内存
	
};

//初始化球
function initSphere(){
	//随机放置球的位置
	for(var iSphere = 0;iSphere<numSpheres;iSphere++){
		//在-sizeGround和sizeGround间随机选一个位置
		var x = Math.random() * sizeGround * 2 - sizeGround;   
		var z = Math.random() * sizeGround * 2 - sizeGround;   	
		posSphere.push(vec2(x,z));
	}
	
	var ptSphere = buildSphere(0.2,15,15);   //创建球的顶点数据
	
	/*创建并初始化一个缓冲对象（buffer Object）*/
	//创建缓冲区对象，存于变量bufferGround中
	bufferSphere = gl.createBuffer();
	//将bufferGround绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferSphere);
	//为buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(
		gl.ARRAY_BUFFER,      //buffer类型
		flatten(ptSphere),    //数据来源
		gl.STATIC_DRAW        //表明是一次提供数据，多遍绘制
	);
	ptSphere.length = 0;    //顶点数据已传至GPU端，可释放内存
	
};

//初始化圆环
function initTorus(){
	//创建圆环顶点数组
	var ptTorus = buildTorus(0.4,0.2,40,20);
	
	/*创建并初始化一个缓冲对象（buffer Object）*/
	//创建缓冲区对象，存于变量bufferGround中
	bufferTorus = gl.createBuffer();
	//将bufferGround绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferTorus);
	//为buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(
		gl.ARRAY_BUFFER,      //buffer类型
		flatten(ptTorus),    //数据来源
		gl.STATIC_DRAW        //表明是一次提供数据，多遍绘制
	);
	ptTorus.length = 0;    //顶点数据已传至GPU端，可释放内存
};


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

	/*设置WebGL相关属性*/
    gl.clearColor(0.0, 0.0, 0.5, 1.0); // 设置背景色为蓝色
	gl.enable(gl.DEPTH_TEST);	// 开启深度检测
	// 设置视口，占满整个canvas
	gl.viewport(0, 0, canvas.width, canvas.height);
	// 设置投影矩阵：透视投影，根据视口宽高比指定视域体
	matProj = perspective(35.0, 		// 垂直方向视角
		canvas.width / canvas.height, 	// 视域体宽高比
		1.0, 							// 相机到近裁剪面距离
		50.0);							// 相机到远裁剪面距离
	
	/*加载shader程序并为shader中attribute变量提供数据*/
	// 加载id分别为"vertex-shader"和"fragment-shader"的shader程序，
	// 并进行编译和链接，返回shader程序对象program
    var program = initShaders(gl, "vertex-shader", 
		"fragment-shader");
    gl.useProgram(program);	// 启用该shader程序对象 
	
	// 获取名称为"a_Position"的shader attribute变量的位置
    a_Position = gl.getAttribLocation(program, "a_Position");
	if(a_Position < 0){ // getAttribLocation获取失败则返回-1
		alert("获取attribute变量a_Position失败！"); 
		return;
	}	
	gl.enableVertexAttribArray(a_Position);	// 为a_Position启用顶点数组

	// 获取名称为"u_MVPMatrix"的shader uniform变量位置
	u_MVPMatrix = gl.getUniformLocation(program, "u_MVPMatrix");
	if(!u_MVPMatrix){
		alert("获取uniform变量u_MVPMatrix失败！")
		return;
	}
	
	// 获取名称为"u_Color"的shader uniform变量位置
	var u_Color = gl.getUniformLocation(program, "u_Color");
	if(!u_Color){
		alert("获取uniform变量u_Color失败！")
		return;
	}
	gl.uniform3f(u_Color, 1.0, 1.0, 1.0); // 传白色
	
	
	intitGround();  //初始化地面缓冲对象（要在获取了a_Position位置之后）
	initSphere();   //初始化球
	initTorus();    //初始化圆环
	
	// 进行绘制
    render();
};


//按键响应
window.onkeydown = function(){
	switch(event.keyCode){
		case 38:  //up
			//matReverse = mult(matReverse,translate(0.0,0.0,-0.1));
			matCamera = mult(translate(0.0,0.0,0.1),matCamera);
			break;
		case 40:  //down
			//matReverse = mult(matReverse,translate(0.0,0.0,0.1));
			matCamera = mult(translate(0.0,0.0,-0.1),matCamera);
			break;
		case 37:  //left
			//matReverse = mult(matReverse,rotateY(1));
			matCamera = mult(rotateY(-1),matCamera);
			break;
		case 39:  //rihgt
			//matReverse = mult(matReverse,rotateY(-1));
			matCamera = mult(rotateY(1),matCamera);
			break;
			
		case 87:  //w
			keyDown[0] = true;
			break;
		case 83:  //s
			keyDown[1] = true;
			break;
		case 65:  //a
			keyDown[2] = true;
			break;
		case 68:  //d
			keyDown[3] = true;
			break;

			
		case 32: 	// space
			if(!isJumping){
				isJumping = true;
				t = 0;
			}
			break;	
			
		case 67: 	// c 蹲
			if(!isSquatDown){
				isSquatDown = true;
				c_t = 0;
			}
			break;		
		
	}
	
	//禁止默认处理（例如上下方向键对滚动条的控制）
	event.preventDefault();
	
};

//按键弹起响应
window.onkeyup = function(){
	switch(event.keyCode){
		case 87:  //w
			keyDown[0] = false;
			break;
		case 83:  //s
			keyDown[1] = false;
			break;
		case 65:  //a
			keyDown[2] = false;
			break;
		case 68:  //d
			keyDown[3] = false;
			break;
	}

};

//更新相机变换函数
function updateCamera(){
	//相机前进
	if(keyDown[0]){
		//matReverse = mult(matReverse,translate(0.0,0.0,-0.1));
		matCamera = mult(translate(0.0,0.0,0.1),matCamera);
	}
	//相机后退
	if(keyDown[1]){
		//matReverse = mult(matReverse,translate(0.0,0.0,0.1));
		matCamera = mult(translate(0.0,0.0,-0.1),matCamera);
	}
	//相机左转
	if(keyDown[2]){
		//matReverse = mult(matReverse,rotateY(1));
		matCamera = mult(rotateY(-1),matCamera);
	}
	//相机右转
	if(keyDown[3]){
		//matReverse = mult(matReverse,rotateY(-1));
		matCamera = mult(rotateY(1),matCamera);
	}
};


//动画
var last = Date.now();
function animation(){
	//旋转小球，根据时间更新旋转角度
	//计算距离上次调用经过多长时间
	var now = Date.now();
	var elapsed = (now - last)/1000.0;  //毫秒
	last = now;
	
	//更新动画状态
	yRot += deltaAngle * elapsed;
	
	//防止溢出
	yRot %= 360;
	
	//jump
	t += elapsed;
	if(isJumping){
		s = v*t - 0.5*g*t*t;   //s=vt – 1/2gt2
		if(s<=0){  //避免掉出地面
			s = 0;
			isJumping = false;  //落地停止不跳
		}
	}
	
	//jump
	c_t += elapsed;
	if(isSquatDown){
		s = c_v*c_t - 0.5*c_g*c_t*c_t;   //s=vt – 1/2gt2
		console.log(s);

		if(s>=0.5){  //避免掉出地面
			s = 0.5;
			isSquatDown = false;  //落地停止不跳
		}
	}

	
};


// 绘制函数
function render() {
	animation();
	updateCamera();
	
	// 清颜色缓存和深度缓存
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
   //相机发生变换（jump）
	var matMVP = mult(matProj,mult(translate(0,-s,0),matCamera));   //MVP矩阵初始化为投影矩阵*相机矩阵（这样写使得matCamera作用于整个场景(后面绘制的所有对象)。）
	
	/* 在render函数中添加代码绘制每个球，
	   现在我们有多个顶点缓冲对象(VBO)了，
	   在绘制不同的对象前，要绑定对应的VBO为当前VBO：
	   gl.bindBuffer(.....)
	*/
	
	/*绘制地面*/
	//绑定对应的顶点缓冲对象
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferGround);  
	//为顶点属性数组提供数据（数据存放在之前buffergroung对象中）
	gl.vertexAttribPointer(
		a_Position,     //属性变量索引
		3,              //每个顶点属性的分量个数
		gl.FLOAT,       //数组数据类型
		false,          //是否进行归一化处理
		0,              //在数组中相邻属性成员起始位置间的间隔（以字节为单位）
		0               //第一个属性值在bufferGround中的偏移量
	);
	mvpStack.push(matMVP);  //进栈
	//将地面往下移一点点（移到y=-0.4平面上）
	matMVP = mult(matMVP,translate(0.0,-0.4,0.0));
	gl.uniformMatrix4fv(u_MVPMatrix,false,
	flatten(matMVP));  //传mvp矩阵
	gl.drawArrays(gl.LINES,0,numVerticesGround);  //绘制地面
	matMVP = mvpStack.pop();   //出栈
	
	//----------------------------------------------------------------------------------
	
	/*绘制每个球*/
	//绑定对应的顶点缓冲对象
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferSphere);  
	//为顶点属性数组提供数据（数据存放在之前buffersphere对象中）
	gl.vertexAttribPointer(
		a_Position,     //属性变量索引
		3,              //每个顶点属性的分量个数
		gl.FLOAT,       //数组数据类型
		false,          //是否进行归一化处理
		0,              //在数组中相邻属性成员起始位置间的间隔（以字节为单位）
		0               //第一个属性值在bufferGround中的偏移量
	);
	for(var i=0;i<numSpheres;i++){
		mvpStack.push(matMVP);   //针对各个球体的实例化变换不相互影响
		
		//另外所有球的中心都在y=0平面上，由于球的半径是0.2，而地面在y=-0.4平面上，
		//因此球是悬在空中的，我们调整下球的高度，让其落地（所以y=-0.2）
		matMVP = mult(matMVP,translate(posSphere[i][0],-0.2,posSphere[i][1]));  //平移到相应位置
		matMVP = mult(matMVP, rotateX(90)); // 调整南北极
		gl.uniformMatrix4fv(u_MVPMatrix,false,
			flatten(matMVP));  //传mvp矩阵
		gl.drawArrays(gl.LINES,0,numVerticesSphere);  //逐个绘制球
		matMVP = mvpStack.pop();  //出栈
	}	
	
	/*绘制旋转的球*/
	//将后面的模型往-z轴方向移动
	//使得他们位于摄像机前方（即世界坐标系原点前方）
	matMVP = mult(matMVP,translate(0.0,0.0,-2.5));
	
	mvpStack.push(matMVP);  //进栈
	//绘制绕原点旋转的球，调整南北极后 （先旋转 在平移？）
	matMVP = mult(matMVP,rotateY(-yRot * 2.0));
	matMVP = mult(matMVP,translate(1.0,0.0,0.0));
	matMVP = mult(matMVP,rotateX(90));  //调整南北极
	gl.uniformMatrix4fv(u_MVPMatrix,false,
		flatten(matMVP));  //传mvp矩阵
	gl.drawArrays(gl.LINES,0,numVerticesSphere);  //绘制球
	matMVP = mvpStack.pop();  //出栈
	
	//----------------------------------------------------------------------------------
	
	/*绘制自转的圆环*/
	//绑定对应的顶点缓冲对象
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferTorus);  
	//为顶点属性数组提供数据（数据存放在之前buffertorus对象中）
	gl.vertexAttribPointer(
		a_Position,     //属性变量索引
		3,              //每个顶点属性的分量个数
		gl.FLOAT,       //数组数据类型
		false,          //是否进行归一化处理
		0,              //在数组中相邻属性成员起始位置间的间隔（以字节为单位）
		0               //第一个属性值在bufferGround中的偏移量
	);
	matMVP = mult(matMVP,rotateY(yRot));
	gl.uniformMatrix4fv(u_MVPMatrix,false,
		flatten(matMVP));  //传mvp矩阵
	gl.drawArrays(gl.LINES,0,numVerticesTorus);  //绘圆环
	
	
	requestAnimFrame(render);  //请求重绘
	
};

/*画球*/
// 用于生成一个中心在原点的球的顶点坐标数据(南北极在z轴方向)
// 返回用于保存球顶点数据的数组，参数为球的半径及经线和纬线数
function buildSphere(radius, columns, rows){
	var vertices = []; // 存放不同顶点的数组

	for (var r = 0; r <= rows; r++){
		var v = r / rows;  // v在[0,1]区间
		var theta1 = v * Math.PI; // theta1在[0,PI]区间

		var temp = vec3(0, 0, 1);
		var n = vec3(temp); // 实现Float32Array深拷贝
		var cosTheta1 = Math.cos(theta1);
		var sinTheta1 = Math.sin(theta1);
		n[0] = temp[0] * cosTheta1 + temp[2] * sinTheta1;
		n[2] = -temp[0] * sinTheta1 + temp[2] * cosTheta1;
		
		for (var c = 0; c <= columns; c++){
			var u = c / columns; // u在[0,1]区间
			var theta2 = u * Math.PI * 2; // theta2在[0,2PI]区间
			var pos = vec3(n);
			temp = vec3(n);
			var cosTheta2 = Math.cos(theta2);
			var sinTheta2 = Math.sin(theta2);
			
			pos[0] = temp[0] * cosTheta2 - temp[1] * sinTheta2;
			pos[1] = temp[0] * sinTheta2 + temp[1] * cosTheta2;
			
			var posFull = mult(pos, radius);
			
			vertices.push(posFull);
		}
	}

	/*生成最终顶点数组数据(使用线段进行绘制)*/
	var spherePoints = []; // 用于存放球顶点坐标的数组

	var colLength = columns + 1;
	for (var r = 0; r < rows; r++){
		var offset = r * colLength;

		for (var c = 0; c < columns; c++){
			var ul = offset  +  c;						// 左上
			var ur = offset  +  c + 1;					// 右上
			var br = offset  +  (c + 1 + colLength);	// 右下
			var bl = offset  +  (c + 0 + colLength);	// 左下

			// 由两条经线和纬线围成的矩形
			// 只绘制从左上顶点出发的3条线段
			spherePoints.push(vertices[ul]);
			spherePoints.push(vertices[ur]);
			spherePoints.push(vertices[ul]);
			spherePoints.push(vertices[bl]);
			spherePoints.push(vertices[ul]);
			spherePoints.push(vertices[br]);
		}
	}

	vertices.length = 0; // 已用不到，释放
	numVerticesSphere = rows * columns * 6; // 顶点数
	
	return spherePoints; // 返回顶点坐标数组
};


/*画圆环*/
// 构建中心在原点的圆环(由线段构建)
// 参数分别为圆环的主半径(决定环的大小)，
// 圆环截面圆的半径(决定环的粗细)，
// numMajor和numMinor决定模型精细程度
// 返回用于保存圆环顶点数据的数组
function buildTorus(majorRadius, minorRadius, numMajor, numMinor){
	var ptTorus = []; // 用于存放圆环顶点坐标的数组
	numVerticesTorus = numMajor * numMinor * 6; // 顶点数

	var majorStep = 2.0 * Math.PI / numMajor;
	var minorStep = 2.0 * Math.PI / numMinor;

	for(var i = 0; i < numMajor; ++i){
		var a0 = i * majorStep;
		var a1 = a0 + majorStep;
		var x0 = Math.cos(a0);
		var y0 = Math.sin(a0);
		var x1 = Math.cos(a1);
		var y1 = Math.sin(a1);

		for(var j = 0; j < numMinor; ++j){
			var b0 = j * minorStep;
			var b1 = b0 + minorStep;
			var c0 = Math.cos(b0);
			var r0 = minorRadius * c0 + majorRadius;
			var z0 = minorRadius * Math.sin(b0);
			var c1 = Math.cos(b1);
			var r1 = minorRadius * c1 + majorRadius;
			var z1 = minorRadius * Math.sin(b1);

			var left0 = vec3(x0*r0, y0*r0, z0);
			var right0 = vec3(x1*r0, y1*r0, z0);
			var left1 = vec3(x0*r1, y0*r1, z1);
			var right1 = vec3(x1*r1, y1*r1, z1);
			ptTorus.push(left0);
			ptTorus.push(right0);
			ptTorus.push(left0);
			ptTorus.push(left1);
			ptTorus.push(left1);
			ptTorus.push(right0);
		}
	}
	return ptTorus;
}

















