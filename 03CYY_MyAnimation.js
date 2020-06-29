//全局变量
var gl;            //webgl上下文(由于requestAnimFrame(render)要求render为无参函数，因此将WebGL上下文gl)
var angle = 0.0;   //旋转角度
var delta = 25.0;  //每秒角度增量
var size = 25;     //正方形边长的一半
var u_Angle;       //shader中uniform变量的“u_Angle”的索引
var direction = true;	//true 为正向，false为逆向

var angle2 = 2.0;   //旋转角度
var delta2 = 30.0;  //每秒角度增量


//顶点位置数据
var vertices = [];
var num01=0;
var num02=0;
 
 

//页面加载完成后会调用此函数，函数名任意（不一定为main，可以为匿名函数）
window.onload=function main(){
	

	
	//获取页面中id为webgl的canvas元素
	var canvas=document.getElementById("webgl");
	if(!canvas){
		alert("获取canvas元素失败");
		return;
	}	
	
	/*利用辅助文件中的功能获取WebGL上下文*/
	//成功则后面可通过gl来调用WebGL的函数
	gl=WebGLUtils.setupWebGL(canvas);
	if(!gl){
		alert("获取WebGL上下文失败！");
		return;
	}
	
	
	//--------------------------------------------------------------------

	
	circular01();
	num01=vertices.length;
	circular02();
	num02=vertices.length-num01;
	
	//-----------------------------------------------------------------------
	
	//设置web相关属性
	//设置视口（此处视口占满整个canvas）
	gl.viewport(0,0,canvas.width,canvas.height);
	
	gl.clearColor(0.0,0.0,0.1,1.0);   //视口背景色设置
	
	/*记载shader程序并为shader中的attribute变量提供数据*/
	//加载id分别为"vertex-shader"和"fragment-shader"的shader程序，
	//并进行编译和链接，返回shader程序对象program
	var program=initShaders(gl,"vertex-shader","fragment-shader");
	gl.useProgram(program);  //启用该shader程序对象
	
	/*将顶点属性对象传给GPU*/
	var verticesbufferId=gl.createBuffer(); //创建buffer
	
	//将id为bufferId的buffer绑定为当前Array Buffer
	gl.bindBuffer(gl.ARRAY_BUFFER,verticesbufferId);
	
	//为当前Array Buffer提供数据，传到GPU
	gl.bufferData(gl.ARRAY_BUFFER,    //buffer类型
		flatten(vertices),            //buffer数据来源，flatten将vertices转换为GPU可接受的格式
		gl.STATIC_DRAW);             //表明将如何使用buffer（STATIC_DRAW表明是一次提供数据，多遍绘制）
	
	
	/*为shader属性变量与buffer数据建立关联*/
	//获取名称为"a_Position"的shader attribute变量的位置
	var a_Position=gl.getAttribLocation(program,"a_Position");
	if(a_Position<0){
		alert("获得attribute变量a_Position失败！");
		return ;
	}
	
	//console.log("a_Position=%d",a_Position);  //后台输出数据，用于调试
	
	//指定利用当前Array Buffer为a_Position提供数据的具体方式
	gl.vertexAttribPointer(a_Position,  //shader arraybute变量位置
		2,  //每个顶点属性有2个分量
		gl.FLOAT,   //数组数据类型为浮点型
		false,      //不进行归一化处理
		0,          //相邻顶点属性地址相差0个字节
		0);         //第一个顶点属性在buffer中偏移量为0字节
	
	gl.enableVertexAttribArray(a_Position); //启用顶点属性数组
	
	
	//---------------------------------------------------------------------------------
	
	//获取shader中uniform变量“u_Angle”索引
	u_Angle = gl.getUniformLocation(program,"u_Angle");
	if(!u_Angle){
		alert("获取uniform变量u_Angle失败！");
		return;
	}
	
	//获取shader中uniform变量“u_matProj”的索引
	var u_matProj = gl.getUniformLocation(program,"u_matProj");
	if(!u_matProj){
		alert("获取uniform变量u_matProj失败！");
		return;
	}
	
	//设置视域体，ortho2D四个参数分别为x和y的范围
	var matProj = ortho2D(-size*2,size*2,-size*2,size*2);
	gl.uniformMatrix4fv(u_matProj,false,flatten(matProj));
	
	//获取shader中uniform变量“u_Color”的索引
	var u_Color = gl.getUniformLocation(program,"u_Color");
	if(!u_Color){
		alert("获取uniform变量u_Color失败！");
		return;
	}
	gl.uniform3f(u_Color,0.8,0.8,0.8);
	
	//---------------------------------------------------------------------------------	

	/*将颜色属性对象传给GPU*/
	//var colorBufferId=gl.createBuffer(); //创建buffer
	
	//将id为bufferId的buffer绑定为当前Array Buffer
	//gl.bindBuffer(gl.ARRAY_BUFFER,colorBufferId);
	
	//为当前Array Buffer提供数据，传到GPU
	//gl.bufferData(gl.ARRAY_BUFFER,    //buffer类型
	//	flatten(colors),            //buffer数据来源，flatten将vertices转换为GPU可接受的格式
	//	gl.STATIC_DRAW);             //表明将如何使用buffer（STATIC_DRAW表明是一次提供数据，多遍绘制）
	
	
	/*为shader属性变量与buffer数据建立关联*/
	//获取名称为"a_Color"的shader attribute变量的位置
	//var a_Color=gl.getAttribLocation(program,"a_Color");
	
	//if(a_Color<0){
	//	alert("获得attribute变量a_Position失败！");
	//	return ;
	//}
	
	//console.log("a_Color=%d",a_Color);  //后台输出数据，用于调试
	
	//指定利用当前Array Buffer为a_Position提供数据的具体方式
	//gl.vertexAttribPointer(a_Color,  //shader arraybute变量位置
	//	3,  //每个顶点属性有3个分量(vec3)
	//	gl.FLOAT,   //数组数据类型为浮点型
	//	false,      //不进行归一化处理
	//	0,          //相邻顶点属性地址相差0个字节
	//	0);         //第一个顶点属性在buffer中偏移量为0字节
	
	//gl.enableVertexAttribArray(a_Color); //启用顶点属性数组	

	//---------------------------------------------------------------------------------
	
	//进行绘制

	render();	
	render2();
	
	
	/*加速按钮功能实现*/
	var incButton = document.getElementById("IncSpeed");
	if(!incButton){
		alert("获取按钮元素IncSpeed失败！");
	}
	/*添加加速按钮点击事件*/
	incButton.onclick = function(){
		delta *=1.5;
	};
	
	
	/*减速按钮功能实现*/
	var decButton = document.getElementById("DecSpeed");
	if(!decButton){
		alert("获取按钮元素DecSpeed失败！");
	}
	/*添加减速按钮点击事件*/
	decButton.onclick = function(){
		delta /=1.5;
	};
	
	
	/*处理颜色菜单*/
	var colorMenu = document.getElementById("ColorMenu");
	if(!colorMenu){
		alert("获取菜单元素colorMenu失败！");
	}
	/*添加菜单项点击事件响应*/
	colorMenu.onclick = function(){
		switch(event.target.index){
			case 0:  
				gl.uniform3f(u_Color,0.8,0.8,0.8);
				break;
			case 1:
				gl.uniform3f(u_Color,1.0,0.0,0.2);
				break;	
			case 2:
				gl.uniform3f(u_Color,0.9,0.6,0.3);
				break;	
			case 3:
				gl.uniform3f(u_Color,0.0,0.8,0.9);
				break;	
		}
	};
	
};


//-----------------------------------------------------------------------------

//记录上一次调用函数的时刻
var last = Date.now();

//绘制函数
function render(){
	
	//计算距离上一次调用经过多少的时间
	var now = Date.now();
	var elasped = now - last;   //(毫秒)
	last = now;
	//根据距离上次调用的时间，更新当前旋转角度
	angle +=delta * elasped/1000.0;
	angle %=360;    //防止溢出
	
	gl.uniform1f(u_Angle,angle);   //将旋转角度传给u_Angle
	
	//用背景色擦除窗口内容
	gl.clear(gl.COLOR_BUFFER_BIT);  
	
	//使用顶点数组进行绘制
	gl.drawArrays(gl.POINTS,    //绘制图元类型为点
		0,          //从第0个顶点开始绘制
		num01);         //使用顶点的个数
		
			
	requestAnimFrame(render);
}

//记录上一次调用函数的时刻
var last2 = Date.now();
function render2(){
	
	//计算距离上一次调用经过多少的时间
	var now = Date.now();
	var elasped = now - last2;   //(毫秒)
	last2 = now;
	//根据距离上次调用的时间，更新当前旋转角度
	angle2 +=delta2 * elasped/1000.0;
	angle2 %=360;    //防止溢出
	
	gl.uniform1f(u_Angle,-angle2);   //将旋转角度传给u_Angle
	
	//用背景色擦除窗口内容
	//gl.clear(gl.COLOR_BUFFER_BIT);  
	
	//使用顶点数组进行绘制
	gl.drawArrays(gl.POINTS,    //绘制图元类型为点
		num01,          //从第0个顶点开始绘制
		num02);         //使用顶点的个数
		
			
	requestAnimFrame(render2);
}


//-------------------------------------------------------------------------------

function circular01(){
	
	for(t=0;t<1200;t++){
		var r= Math.random()*40;
		var x = r * Math.cos(t * 360);
		var y = r * Math.sin(t * 360);
		var p=vec2(x,y);
		vertices.push(p);
	}
		
	for(t=0;t<800;t++){
		var r= 8;
		var x = r * Math.cos(t * 150);
		var y = r * Math.sin(t * 90);
		var p=vec2(x,y);
		vertices.push(p);
	}
};

function circular02(){
	
	for(t=0;t<1200;t++){
		var r= Math.random()*4;
		var x = r * Math.cos(t * 270)-15;
		var y = r * Math.sin(t * 150)-15;
		var p=vec2(x,y);
		vertices.push(p);
	}
		
}













