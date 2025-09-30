/**
 * Stage 1 JSON Parser and Data Binder
 * JSON 파일을 파싱하여 스토리보드 UI에 데이터를 바인딩
 */

class Stage1JSONParser {
    constructor() {
        this.data = null;
        this.parsedData = {
            basic: {},
            direction: {},
            characters: [],
            locations: [],
            props: []
        };
    }

    /**
     * JSON 파일 로드 및 파싱
     */
    async loadJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    this.data = JSON.parse(e.target.result);
                    console.log('✅ JSON 파일 로드 성공:', this.data.film_metadata.title_working);
                    this.parseAllBlocks();
                    resolve(this.parsedData);
                } catch (error) {
                    console.error('❌ JSON 파싱 에러:', error);
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                console.error('❌ 파일 읽기 에러:', error);
                reject(error);
            };

            reader.readAsText(file);
        });
    }

    /**
     * 모든 블록 파싱
     */
    parseAllBlocks() {
        this.extractBasicBlock();
        this.extractDirectionBlock();
        this.extractCharacterBlocks();
        this.extractLocationBlocks();
        this.extractPropsBlocks();
    }

    /**
     * 기본블록 데이터 추출
     */
    extractBasicBlock() {
        if (!this.data?.film_metadata) return;

        const metadata = this.data.film_metadata;
        this.parsedData.basic = {
            title: metadata.title_working || '',
            genre: metadata.genre || '',
            duration: metadata.duration_minutes ? `${metadata.duration_minutes}분` : '',
            style: metadata.style || '',
            artist: metadata.artist || '',
            medium: metadata.medium || '',
            era: metadata.era || '',
            aspectRatio: metadata.aspect_ratio || ''
        };

        console.log('📋 기본블록 추출:', this.parsedData.basic);
    }

    /**
     * 연출블록 데이터 추출
     */
    extractDirectionBlock() {
        if (!this.data?.current_work) return;

        const work = this.data.current_work;
        this.parsedData.direction = {
            logline: work.logline || '',
            synopsis: work.synopsis || {},
            sequences: work.treatment?.sequences || [],
            scenes: work.scenario?.scenes || []
        };

        console.log('🎬 연출블록 추출:', this.parsedData.direction);
    }

    /**
     * 캐릭터블록 데이터 추출
     */
    extractCharacterBlocks() {
        if (!this.data?.visual_blocks?.characters) return;

        this.parsedData.characters = this.data.visual_blocks.characters.map(char => ({
            id: char.id,
            name: char.name,
            blocks: this.parseCharacterFields(char.blocks),
            detail: char.character_detail || '',
            voiceStyle: char.voice_style || ''
        }));

        console.log('👥 캐릭터블록 추출:', this.parsedData.characters);
    }

    /**
     * 캐릭터 필드 파싱
     */
    parseCharacterFields(blocks) {
        if (!blocks) return {};

        return {
            style: blocks['1_STYLE'] || '',
            artist: blocks['2_ARTIST'] || '',
            medium: blocks['3_MEDIUM'] || '',
            genre: blocks['4_GENRE'] || '',
            character: blocks['5_CHARACTER'] || '',
            moodPersonality: blocks['6_MOOD_PERSONALITY'] || '',
            era: blocks['7_ERA'] || '',
            camera: blocks['8_CAMERA'] || '',
            gaze: blocks['9_GAZE'] || '',
            characterSheet: blocks['10_CHARACTER_SHEET'] || '',
            bodyType: blocks['11_BODY_TYPE'] || '',
            hair: blocks['12_HAIR'] || '',
            faceShape: blocks['13_FACE_SHAPE'] || '',
            facialFeatures: blocks['14_FACIAL_FEATURES'] || '',
            skin: blocks['15_SKIN'] || '',
            expression: blocks['16_EXPRESSION'] || '',
            clothing: blocks['17_CLOTHING'] || '',
            accessories: blocks['18_ACCESSORIES'] || '',
            props: blocks['19_PROPS'] || '',
            pose: blocks['20_POSE'] || '',
            background: blocks['21_BACKGROUND'] || '',
            lighting: blocks['22_LIGHTING'] || '',
            cameraTech: blocks['23_CAMERA_TECH'] || '',
            quality: blocks['24_QUALITY'] || '',
            parameter: blocks['25_PARAMETER'] || ''
        };
    }

    /**
     * 장소블록 데이터 추출
     */
    extractLocationBlocks() {
        if (!this.data?.visual_blocks?.locations) return;

        this.parsedData.locations = this.data.visual_blocks.locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            blocks: this.parseLocationFields(loc.blocks)
        }));

        console.log('📍 장소블록 추출:', this.parsedData.locations);
    }

    /**
     * 장소 필드 파싱
     */
    parseLocationFields(blocks) {
        if (!blocks) return {};

        return {
            style: blocks['1_STYLE'] || '',
            artist: blocks['2_ARTIST'] || '',
            medium: blocks['3_MEDIUM'] || '',
            genre: blocks['4_GENRE'] || '',
            location: blocks['5_LOCATION'] || '',
            era: blocks['6_ERA'] || '',
            camera: blocks['7_CAMERA'] || '',
            locationSheet: blocks['8_LOCATION_SHEET'] || '',
            atmosphere: blocks['9_ATMOSPHERE'] || '',
            colorTone: blocks['10_COLOR_TONE'] || '',
            scale: blocks['11_SCALE'] || '',
            architecture: blocks['12_ARCHITECTURE'] || '',
            material: blocks['13_MATERIAL'] || '',
            object: blocks['14_OBJECT'] || '',
            weather: blocks['15_WEATHER'] || '',
            naturalLight: blocks['16_NATURAL_LIGHT'] || '',
            artificialLight: blocks['17_ARTIFICIAL_LIGHT'] || '',
            lighting: blocks['18_LIGHTING'] || '',
            foreground: blocks['19_FOREGROUND'] || '',
            midground: blocks['20_MIDGROUND'] || '',
            background: blocks['21_BACKGROUND'] || '',
            leftSide: blocks['22_LEFT_SIDE'] || '',
            rightSide: blocks['23_RIGHT_SIDE'] || '',
            ceilingSky: blocks['24_CEILING/SKY'] || '',
            floorGround: blocks['25_FLOOR/GROUND'] || '',
            cameraTech: blocks['26_CAMERA_TECH'] || '',
            quality: blocks['27_QUALITY'] || '',
            parameter: blocks['28_PARAMETER'] || ''
        };
    }

    /**
     * 소품블록 데이터 추출
     */
    extractPropsBlocks() {
        if (!this.data?.visual_blocks?.props) return;

        this.parsedData.props = this.data.visual_blocks.props.map(prop => ({
            id: prop.id,
            name: prop.name,
            blocks: this.parsePropsFields(prop.blocks),
            detail: prop.prop_detail || ''
        }));

        console.log('🎭 소품블록 추출:', this.parsedData.props);
    }

    /**
     * 소품 필드 파싱
     */
    parsePropsFields(blocks) {
        if (!blocks) return {};

        return {
            style: blocks['1_STYLE'] || '',
            artist: blocks['2_ARTIST'] || '',
            medium: blocks['3_MEDIUM'] || '',
            genre: blocks['4_GENRE'] || '',
            itemName: blocks['5_ITEM_NAME'] || '',
            era: blocks['6_ERA'] || '',
            camera: blocks['7_CAMERA'] || '',
            itemSheet: blocks['8_ITEM_SHEET'] || '',
            category: blocks['9_CATEGORY'] || '',
            material: blocks['10_MATERIAL'] || '',
            color: blocks['11_COLOR'] || '',
            size: blocks['12_SIZE'] || '',
            condition: blocks['13_CONDITION'] || '',
            details: blocks['14_DETAILS'] || '',
            functionality: blocks['15_FUNCTIONALITY'] || '',
            specialFeatures: blocks['16_SPECIAL_FEATURES'] || '',
            lighting: blocks['17_LIGHTING'] || '',
            background: blocks['18_BACKGROUND'] || '',
            cameraTech: blocks['19_CAMERA_TECH'] || '',
            quality: blocks['20_QUALITY'] || '',
            parameter: blocks['21_PARAMETER'] || ''
        };
    }

    /**
     * 특정 시퀀스 데이터 가져오기
     */
    getSequenceById(sequenceId) {
        return this.parsedData.direction.sequences.find(seq => seq.sequence_id === sequenceId);
    }

    /**
     * 특정 씬 데이터 가져오기
     */
    getSceneById(sceneId) {
        return this.parsedData.direction.scenes.find(scene => scene.scene_id === sceneId);
    }

    /**
     * 시퀀스별 씬 가져오기
     */
    getScenesBySequence(sequenceId) {
        return this.parsedData.direction.scenes.filter(scene => scene.sequence_id === sequenceId);
    }
}

// 전역 인스턴스 생성
window.stage1Parser = new Stage1JSONParser();