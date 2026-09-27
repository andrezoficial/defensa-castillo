bindUIEvents();
const phaserConfig={type:Phaser.AUTO,width:GAME_WIDTH,height:GAME_HEIGHT,parent:'gameHost',backgroundColor:'#314d27',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false,roundPixels:true},scene:MainScene};
new Phaser.Game(phaserConfig);
