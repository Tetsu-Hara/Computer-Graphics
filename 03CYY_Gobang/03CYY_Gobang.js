// Gobang.js
 
// 全局变量
var canvas;
var gl;						// WebGL上下文

// 以下全局变量用于控制动画的状态和速度
var angleY = 0.0;		// 绕y轴旋转的角度
var angleX = 45.0;		// 绕x轴旋转的角度
var angleStep = 3.0;	// 角度变化步长(3度)

var mvpStack = [];  // 模视投影矩阵栈，用数组实现，初始为空
var matProj;	    // 投影矩阵
var matMVP;			// 模视投影矩阵

// shader中变量的索引
var a_Position;  	// shader中attribute变量a_Position的索引
var u_MVPMatrix;	// shader中uniform变量"u_MVPMatrix"的索引
var u_Color;		// shader中uniform变量"u_Color"的索引

/*棋盘线（line）相关变量*/
var bufferChessline;   //棋盘线line对应的buffer
var numVerticesChessline;  //顶点数

/*棋盘面相关变量*/
var bufferChessboard;   //棋盘对应的buffer
var numVerticesChessboard = 6;  //顶点数

/*落子点状态数组，一共15*15个*/
//0表示没有棋子，1表示有白子，-1表示有黑子，初始为0
var chess = new Array(15);  //先定义成一维

/*球对象相关变量（球相当于棋子）*/
var bufferSphere;  //球对应的buffer
var numVerticesSphere;  //球顶点数

var turn = 1;  //用于决定轮到黑方（-1）还是白方（1）走棋

/*拾取*/
var FBOforSelect;  //用于拾取FBO

/*胜负状态*/
var winFlag = 0;   //0未分胜负，1为白方胜，-1黑方胜



//初始化棋盘线（Line）缓冲区对象（VBO）
function initChessline(){
	
	var ptChessline = [];  //顶点坐标数组
	numVerticesChessline = 0;  //初始顶点数
	
	for(var i=-7;i<=7;i++){
		//垂直方向直线
		ptChessline.push(vec3(i,0.0,7.0));
		ptChessline.push(vec3(i,0.0,-7.0));
		//水平方向直线
		ptChessline.push(vec3(-7.0,0.0,i));
		ptChessline.push(vec3(7.0,0.0,i));
		numVerticesChessline += 4;  //更新顶点数
	}
	
	/*创建并初始化一个缓冲区对象（Buffer Object）*/
	//创建缓冲区对象，存于变量bufferChessboard中
	bufferChessline = gl.createBuffer();
	//将bufferChessboard绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferChessline);
	//为buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(gl.ARRAY_BUFFER,  //buffer类型
		flatten(ptChessline),   //数据来源
		gl.STATIC_DRAW  //表明是一次提供数据，多遍绘制
	);
	ptChessline.length = 0;  //顶点数据已传到GPU端，可释放内存
	
};


//初始化棋盘缓冲区对象（VBO）
function initChessboard(){
	
	//棋盘用一正方形建模，左上角（-8,0,-8），右下角（8,0,8）
	var ptChessboard = [
		vec3(-8.0,0.0,-8.0),
		vec3(-8.0,0.0,8.0),
		vec3(8.0,0.0,8.0),
		
		vec3(-8.0,0.0,-8.0),
		vec3(8.0,0.0,8.0),
		vec3(8.0,0.0,-8.0)
	];
	
	/*创建并初始化一个缓冲区对象（Buffer Object）*/
	//创建缓冲区对象，存于变量bufferChessboard中
	bufferChessboard = gl.createBuffer();
	//将bufferChessboard绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferChessboard);
	//为buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(gl.ARRAY_BUFFER,  //buffer类型
		flatten(ptChessboard),   //数据来源
		gl.STATIC_DRAW  //表明是一次提供数据，多遍绘制
	);
	ptChessboard.length = 0;  //顶点数据已传到GPU端，可释放内存
	
};


//初始化棋子（球）缓冲区对象（VBO）
function initSphere(){
	
	var ptSphere = buildSphere(0.4,10,10);  //生成球顶点数据
	
	/*创建并初始化一个缓冲区对象（Buffer Object）*/
	//创建缓冲区对象，存于变量bufferChessboard中
	bufferSphere = gl.createBuffer();
	//将bufferChessboard绑定为当前Array Buffer对象
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferSphere);
	//为buffer对象在GPU端申请空间，并提供数据
	gl.bufferData(gl.ARRAY_BUFFER,  //buffer类型
		flatten(ptSphere),   //数据来源
		gl.STATIC_DRAW  //表明是一次提供数据，多遍绘制
	);
	ptSphere.length = 0;  //顶点数据已传到GPU端，可释放内存
	
};


//初始化用于拾取的（FBO）
//用于拾取的帧缓存由一个颜色缓存和一个深度缓存构成
function initFrameBufferForSelect(){
	//创建帧缓存对象、颜色缓存对象、深度缓存对象、
	FBOforSelect = gl.createFramebuffer();
	var colorBuffer = gl.createRenderbuffer();
	var depthBuffer = gl.createRenderbuffer();
	
	//创建颜色缓存（尺寸和canvas一样）
	gl.bindRenderbuffer(gl.RENDERBUFFER, colorBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER,   //buffer类型
		gl.RGBA4,        //内部存储格式，RGBA各占4位
		canvas.width,    //buffer宽
		canvas.height    //buffer高
	);
	
	//创建深度缓存（尺寸和canvas一样）
	gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER,   //buffer类型
		gl.DEPTH_COMPONENT16,        //内部存储格式，16位深度
		canvas.width,    //buffer宽
		canvas.height    //buffer高
	);
	
	//将FBOforSelect绑定为当前FBO
	gl.bindFramebuffer(gl.FRAMEBUFFER, FBOforSelect);
	
	//将colorbuffer对应的缓存设为当前FBO的颜色缓存(让Renderbuffer与framebuffer对应)
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
		gl.RENDERBUFFER,
		colorBuffer);
		
	//将depthbuffer对应的缓存设为当前FBO的颜色缓存(让Renderbuffer与framebuffer对应)
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
		gl.RENDERBUFFER,
		depthBuffer);
	
	//绑定默认FrameBuffer（防止正常绘画时，画到拾取用的FrameBuffer上）
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
};


// 页面加载完成后会调用此函数，函数名可任意(不一定为main)
window.onload = function main(){
	// 获取页面中id为webgl的canvas元素
    canvas = document.getElementById("webgl");
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
    gl.clearColor(0.5, 0.5, 0.5, 1.0); // 设置背景色为灰色
	gl.enable(gl.DEPTH_TEST);	// 开启深度检测
	gl.enable(gl.CULL_FACE);	// 开启面剔除，默认剔除背面
	// 设置视口，占满整个canvas
	gl.viewport(0, 0, canvas.width, canvas.height);
	// 设置投影矩阵：透视投影，根据视口宽高比指定视域体
	matProj = perspective(35.0, 		// 垂直方向视角
		canvas.width / canvas.height, 	// 视域体宽高比
		1.0, 							// 相机到近裁剪面距离
		100.0);							// 相机到远裁剪面距离
	
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
	u_Color = gl.getUniformLocation(program, "u_Color");
	if(!u_Color){
		alert("获取uniform变量u_Color失败！")
		return;
	}
	
	
	//添加鼠标按键消息响应
	canvas.onmousedown = function(){
		
		//左键 && 胜利后不能落子
		if(event.button == 0 && !winFlag){  
			//窗口客户区坐标系下的坐标，原点在客户区左上角
			//x轴向右，y轴向下
			var x = event.clientX, y = event.clientY;
			//获取canvas再客户区中的位置区域
			var rect = event.target.getBoundingClientRect();
			//计算对应的WebGL窗口系下的坐标
			var x_in_canvas = x - rect.left;
			var y_in_canvas = rect.bottom - y;
			var id = getSelectedObj(x_in_canvas,y_in_canvas);
			
			if(id >= 0){  //有拾取到落子点？
				//根据id得到该对象的行列值
				var i = Math.floor(id / 15);  //取整
				var j = id % 15;
				if(chess[i][j] == 0){   //若该位置没有棋子（有棋子的话不用处理）
					chess[i][j] = turn;  //修改落子点状态
					
					if(checkWin(turn)){  //检查刚才下的棋子有没有导致胜利
						winFlag = turn;
						//10毫秒后弹出胜负判定窗口
						setTimeout(function(){
							if(winFlag > 0){
								alert("白方胜利。");
							}else{
								alert("黑方胜利。");
							}
						});
					}
					
					turn = -turn;    //改变下棋方
					requestAnimFrame(render);   //请求重绘
				}
			}
		}
		
		//鼠标右键重新开始
		if(event.button == 2){
			winFlag = 0;  //重置胜负标签
			//重置落子状态
			for(var i=0;i<15;i++){
				for(var j=0;j<15;j++){
					chess[i][j] = 0;
				}
			}
			requestAnimFrame(render); //请求重绘
		}
	}
	
	//屏蔽默认右键菜单
	canvas.oncontextmenu = function(){
		event.preventDefault();
	};
	
	
	//初始化落子点状态数组
	for(var i=0;i<15;i++){
		chess[i] = new Array(15);
		for(var j=0;j<15;j++){
			chess[i][j] = 0;
		}
	}
	
	
	//初始化棋盘线（Line）缓冲区对象
	initChessline();
	
	//初始化棋盘缓冲区对象
	initChessboard();
	
	//初始化棋子（球）缓冲区对象
	initSphere();
	
	//初始化用于拾取的（FBO）
	initFrameBufferForSelect();
	
	// 进行绘制
    render();
};


//拾取用，绘制棋子函数
function drawChessmanForSelect(i,j){
	mvpStack.push(matMVP);
	
	//根据i和j决定棋子颜色
	gl.uniform4f(u_Color, i*17/255.0, j*17/255.0, 0.0, 1.0);
	//通过平移变换将棋子从原点位置，移动到第i行第j列位置
	matMVP = mult(matMVP,translate(-7.0 + j * 1.0, 0, -7.0 + i * 1.0));
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(matMVP));
	gl.drawArrays(gl.TRIANGLES, 0, numVerticesSphere);
	
	matMVP = mvpStack.pop();
};


//绘制第i行第j列的棋子
function drawChessman(i,j){
	//push，pop防止平移变换对后续棋子位置产生影响
	mvpStack.push(matMVP);
	
	if(chess[i][j]>0){   //白棋
		gl.uniform4f(u_Color,1.0,1.0,1.0,1.0);
	}else{   //黑棋
		gl.uniform4f(u_Color,0.0,0.0,0.0,1.0);
	}
	
	//通过平移变换将棋子从原点位置，移动到第i行第j列位置
	matMVP = mult(matMVP,translate(-7.0+j*1.0,0,-7.0+i*1.0));
	gl.uniformMatrix4fv(u_MVPMatrix,false,flatten(matMVP));
	gl.drawArrays(gl.TRIANGLES,0,numVerticesSphere);
	
	matMVP = mvpStack.pop();
	
};


// 绘制函数
function render() {
	// 清颜色缓存和深度缓存
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
	// 创建变换矩阵
	matMVP = mult(matProj,		 			// 投影矩阵
		mult(translate(0.0, 0.0, -35.0), 	// 沿z轴平移
		mult(rotateY(angleY),	     		// 绕y轴旋转
		rotateX(angleX))));		     		// 绕x轴旋转
	
	// 传值给shader中的u_MVPMatrix
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(matMVP));
	
	
	/*绘制棋盘*/
	gl.enable(gl.POLYGON_OFFSET_FILL);  //开启多边形填充时深度偏移
	gl.polygonOffset(1.0,1.0);  //设置偏离公式参数
	gl.uniform4f(u_Color,0.93,0.8,0.22,1.0);  //指定棋盘颜色
	//将棋盘buffer绑定为当前buffer
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferChessboard);
	//为顶点属性数组提供数据（数组存放在bufferChessBoard对象中）
	gl.vertexAttribPointer(
		a_Position,   //属性变量的索引
		3,            //每个顶点属性的分量个数
		gl.FLOAT,     //数组数据类型
		false,        //是否进行归一化处理
		0,            //在数组相邻属性成员起位置间的间隔（一字节为单位）
		0             //第一个属性值在buffer中的偏移量
	);
	gl.drawArrays(gl.TRIANGLES,0,numVerticesChessboard);
	gl.disable(gl.POLYGON_OFFSET_FILL);  //关闭多边形填充时深度偏移量
	
	
	/*绘制棋盘线*/
	gl.uniform4f(u_Color,0.0,0.0,0.0,1.0);  //黑色棋盘线
	//将棋盘buffer绑定为当前buffer
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferChessline);
	//为顶点属性数组提供数据（数组存放在bufferChessBoard对象中）
	gl.vertexAttribPointer(
		a_Position,   //属性变量的索引
		3,            //每个顶点属性的分量个数
		gl.FLOAT,     //数组数据类型
		false,        //是否进行归一化处理
		0,            //在数组相邻属性成员起位置间的间隔（一字节为单位）
		0             //第一个属性值在buffer中的偏移量
	);
	gl.drawArrays(gl.LINES,0,numVerticesChessline);
	
	
	/*绘制棋子*/
	//将棋盘buffer绑定为当前buffer
	gl.bindBuffer(gl.ARRAY_BUFFER,bufferSphere);
	//为顶点属性数组提供数据（数组存放在bufferChessBoard对象中）
	gl.vertexAttribPointer(
		a_Position,   //属性变量的索引
		3,            //每个顶点属性的分量个数
		gl.FLOAT,     //数组数据类型
		false,        //是否进行归一化处理
		0,            //在数组相邻属性成员起位置间的间隔（一字节为单位）
		0             //第一个属性值在buffer中的偏移量
	);
	//遍历所有落子点，根据chess[i][j]的值进行绘制
	for(var i=0;i<15;i++){
		for(var j=0;j<15;j++){
			if(chess[i][j]){  //非0时表示有棋子
				drawChessman(i,j);  //绘制棋子
			}
		}
	}
	
};

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
};


//进行拾取的绘制，返回拾取结果
//如果返回值为-2，表示FBO不完整
//如果返回值为-1，表示拾取到的是背景
//否则返回拾取到的对象id（行号*15+列号）
//x,y为鼠标在窗口坐标系下的坐标（原点在canvas左下角，x向右y向上）
function getSelectedObj(x,y){
	//用于存读取到的像素RGBA值
	var pixels = new Uint8Array(4);
	
	//检查拾取用VBO为当前VBO
	gl.bindFramebuffer(gl.FRAMEBUFFER,FBOforSelect);
	
	//检查FBO完整性
	var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if(status == gl.FRAMEBUFFER_COMPLETE){
		//清除颜色缓存和深度缓存内容
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		//创建变换矩阵(投影矩阵，沿z轴平行，绕y轴旋转，绕x轴旋转)
		matMVP = mult(matProj,mult(translate(0.0,0.0,-35.0),mult(rotateY(angleY),rotateX(angleX))));
		
		//传值给shader中的u_MVPMatrix
		gl.uniformMatrix4fv(u_MVPMatrix,false,flatten(matMVP));
		
		/*绘制棋子*/
		//将球buffer绑定为当前buffer
		gl.bindBuffer(gl.ARRAY_BUFFER,bufferSphere);
		//为顶点属性数组提供数据（数组存放在bufferSphere对象中）
		gl.vertexAttribPointer(
			a_Position,   //属性变量的索引
			3,            //每个顶点属性的分量个数
			gl.FLOAT,     //数组数据类型
			false,        //是否进行归一化处理
			0,            //在数组相邻属性成员起位置间的间隔（一字节为单位）
			0             //第一个属性值在buffer中的偏移量
		);
		//遍历所有落子点，在每个落棋点绘制棋子
		for(var i=0;i<15;i++){
			for(var j=0;j<15;j++){
				drawChessmanForSelect(i,j);  //绘制棋子
			}
		}
		gl.finish();  //强制绘制完
		
		//获取与鼠标位置对应的FrameBuffer中的像素颜色
		gl.readPixels(x,   //像素区域左下角x坐标（窗口坐标系）
			y,             //像素区域左下角y坐标（窗口坐标系）
			1,1,           //像素区域的宽度和高度
			gl.RGBA,       //获取到的像素格式
			gl.UNSIGNED_BYTE,  //数据类型
			pixels);       //存放获取结果的数组(!)
	}
	else{
		return -2;  //返回-2表示出错
	}
	
	//解除绑定，使用默认帧缓存
	gl.bindFramebuffer(gl.FRAMEBUFFER,null);
	
	if(pixels[2] > 0){   //若蓝色分量非0，说明为背景颜色，返回-1
		return -1;
	}else{
		//获取到落子点的行列号
		var i = pixels[0] / 17;
		var j = pixels[1] / 17;
		//返回拾取到的落子点id
		return i * 15 + j;
	}
	
};


/*胜负判断*/
//检测turn方胜负状态（如turn为1是检测白方是否胜利）
//胜利时返回turn，否则返回false（即0）
function checkWin(turn){
	var flag;  //胜负标志
	var n;     //循环变量
	
	//遍历chess
	for(var i=0;i<15;i++){
		for(var j=0;j<15;j++){
			if(chess[i][j] == turn){  //如果该位置有turn方的棋子
				//检查右方
				if(j<11){ //保证右方有足够空位
					flag = true;
					for(n = 1; n < 5;n++){  //检查连续四个位置
						//有一位置不为该方棋子则返回false
						if(chess[i][j + n] != turn){
							flag = false;
							break;
						}
					}
					if(flag){  //连续四个棋都为turn方
						return turn;  //判断turn方胜利
					}
				}
				//检查下方
				if(i<11){
					flag = true;
					for(n=1; n<5; n++){
						if(chess[i + n][j] != turn){
							flag = false;
							break;
						}
					}
					if(flag){  //连续四个棋都为turn方
						return turn;  //判断turn方胜利
					}
				}
				//检查左下
				if(i<11 && j>3){
					flag = true;
					for(n=1; n<5; n++){
						if(chess[i + n][j - n] != turn){
							flag = false;
							break;
						}
					}
					if(flag){  //连续四个棋都为turn方
						return turn;  //判断turn方胜利
					}
				}
				//检查右下
				if(i<11 && j<11){
					flag = true;
					for(n=1; n<5; n++){
						if(chess[i + n][j + n] != turn){
							flag = false;
							break;
						}
					}
					if(flag){  //连续四个棋都为turn方
						return turn;  //判断turn方胜利
					}
				}
			}
		}
	}
	return false;
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
			// 使用三角形进行绘制
			spherePoints.push(vertices[ul]);
			spherePoints.push(vertices[bl]);
			spherePoints.push(vertices[br]);
			spherePoints.push(vertices[ul]);
			spherePoints.push(vertices[br]);
			spherePoints.push(vertices[ur]);
		}
	}

	vertices.length = 0; // 已用不到，释放
	numVerticesSphere = rows * columns * 6; // 顶点数
	
	return spherePoints; // 返回顶点坐标数组
}; 

