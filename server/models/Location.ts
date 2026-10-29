import mongoose,{Schema,type Model, type Document} from 'mongoose';
export const LOCATION_TYPES=['institution','campus','building','college','park','library','cafeteria','bus_stand','other'] as const;
export interface ILocation extends Document{name:string;type:typeof LOCATION_TYPES[number];parentId?:mongoose.Types.ObjectId;address?:string;active:boolean;createdAt:Date;updatedAt:Date}
const schema=new Schema<ILocation>({name:{type:String,required:true,trim:true,minlength:2,maxlength:120},type:{type:String,enum:LOCATION_TYPES,required:true,index:true},parentId:{type:Schema.Types.ObjectId,ref:'Location'},address:{type:String,trim:true,maxlength:250},active:{type:Boolean,default:true,index:true}},{timestamps:true});schema.index({name:1,parentId:1},{unique:true});
export const Location:Model<ILocation>=mongoose.models.Location||mongoose.model<ILocation>('Location',schema);
