// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'customer.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Customer _$CustomerFromJson(Map<String, dynamic> json) => Customer(
      id: json['id'] as int,
      organizationId: json['organizationId'] as int,
      userId: json['userId'] as int?,
      uid: json['uid'] as String,
      name: json['name'] as String,
      email: json['email'] as String?,
      mobile: json['mobile'] as String?,
      address: json['address'] as String?,
      vipLevel: json['vipLevel'] as int?,
      remarks: json['remarks'] as String?,
    );

Map<String, dynamic> _$CustomerToJson(Customer instance) => <String, dynamic>{
      'id': instance.id,
      'organizationId': instance.organizationId,
      'userId': instance.userId,
      'uid': instance.uid,
      'name': instance.name,
      'email': instance.email,
      'mobile': instance.mobile,
      'address': instance.address,
      'vipLevel': instance.vipLevel,
      'remarks': instance.remarks,
    };
