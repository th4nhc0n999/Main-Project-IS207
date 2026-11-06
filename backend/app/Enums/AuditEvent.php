<?php

namespace App\Enums;

enum AuditEvent: string
{
    case AU_01 = 'AU-01'; // Đăng ký tài khoản (User registered)
    case AU_02 = 'AU-02'; // Đăng nhập thành công (Login success)
    case AU_03 = 'AU-03'; // Đăng nhập thất bại / Khóa tài khoản (Login failed / Account locked)
    case AU_04 = 'AU-04'; // Đăng xuất (User logged out)
    case AU_05 = 'AU-05'; // Đổi mật khẩu / Bắt buộc đổi lần đầu (Password changed)
    case AU_06 = 'AU-06'; // Tạo hồ sơ bệnh nhân (Patient profile created)
    case AU_07 = 'AU-07'; // Cập nhật hồ sơ bệnh nhân (Patient profile updated)
    case AU_08 = 'AU-08'; // Xoá / Lưu trữ hồ sơ bệnh nhân (Patient profile deleted/archived)
    case AU_09 = 'AU-09'; // Xác nhận / Rút đồng ý xử lý dữ liệu (Patient consent agreed/revoked)
    case AU_10 = 'AU-10'; // Đặt lịch khám T01 (Booking created)
    case AU_11 = 'AU-11'; // Hủy lịch khám T04/T08/T10/T13 (Booking cancelled)
    case AU_12 = 'AU-12'; // Bác sĩ duyệt/từ chối lịch T05/T06 (Booking approved/rejected)
    case AU_13 = 'AU-13'; // Hết hạn giữ chỗ/duyệt T03/T07 (Booking expired)
    case AU_14 = 'AU-14'; // Tiếp nhận & Check-in QR T09 (Booking checked in)
    case AU_15 = 'AU-15'; // Hoàn thành ca khám T12 (Booking completed)
    case AU_16 = 'AU-16'; // Xác nhận vắng mặt No-show T11 (Booking marked no-show)
    case AU_17 = 'AU-17'; // Giao dịch thanh toán / Demo payment (Payment transaction recorded)
    case AU_18 = 'AU-18'; // Yêu cầu / Duyệt hoàn tiền (Refund requested/approved/processed)
    case AU_19 = 'AU-19'; // Quản lý khung giờ khám / Slot (Slot created/locked/updated)
    case AU_20 = 'AU-20'; // Quản trị tài khoản / Tạo tài khoản bác sĩ (Admin user management)
}

