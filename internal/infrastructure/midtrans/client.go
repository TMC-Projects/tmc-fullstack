package midtrans

import (
	"crypto/sha512"
	"fmt"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
)

// Client is a wrapper around the Midtrans Core API client.
type Client struct {
	core       coreapi.Client
	serverKey  string
	merchantID string
}

// BankTransferResult holds the result of a bank transfer charge.
type BankTransferResult struct {
	TransactionID   string
	OrderID         string
	GrossAmount     string
	TransactionTime string
	ExpiryTime      string
	VANumbers       []VANumber
	PaymentType     string
	StatusCode      string
}

// VANumber represents a Virtual Account number detail.
type VANumber struct {
	Bank     string
	VANumber string
}

// NewClient creates a new Midtrans Core API client configured for Sandbox.
func NewClient(serverKey, merchantID string) *Client {
	c := coreapi.Client{}
	c.New(serverKey, midtrans.Sandbox)
	return &Client{
		core:       c,
		serverKey:  serverKey,
		merchantID: merchantID,
	}
}

// ChargeBankTransfer charges a bank transfer (Virtual Account) via Midtrans Core API.
// Supported banks: "bca", "bni", "bri", "permata", "mandiri".
func (c *Client) ChargeBankTransfer(orderID string, amount int64, bank string) (*BankTransferResult, error) {
	var bankCode midtrans.Bank
	var paymentType coreapi.CoreapiPaymentType

	switch bank {
	case "mandiri":
		// Mandiri uses echannel (bill payment), not standard BankTransfer
		chargeReq := &coreapi.ChargeReq{
			PaymentType: coreapi.PaymentTypeEChannel,
			TransactionDetails: midtrans.TransactionDetails{
				OrderID:  orderID,
				GrossAmt: amount,
			},
			EChannel: &coreapi.EChannelDetail{
				BillInfo1: "Payment for Njara Subscription",
				BillInfo2: orderID,
			},
		}
		resp, err := c.core.ChargeTransaction(chargeReq)
		if err != nil {
			return nil, fmt.Errorf("midtrans mandiri charge error: %w", err)
		}
		return &BankTransferResult{
			TransactionID:   resp.TransactionID,
			OrderID:         resp.OrderID,
			GrossAmount:     resp.GrossAmount,
			TransactionTime: resp.TransactionTime,
			ExpiryTime:      resp.ExpiryTime,
			PaymentType:     string(resp.PaymentType),
			StatusCode:      resp.StatusCode,
			VANumbers: []VANumber{
				{Bank: "mandiri", VANumber: resp.BillKey},
			},
		}, nil
	case "bca":
		bankCode = midtrans.BankBca
		paymentType = coreapi.PaymentTypeBankTransfer
	case "bni":
		bankCode = midtrans.BankBni
		paymentType = coreapi.PaymentTypeBankTransfer
	case "bri":
		bankCode = midtrans.BankBri
		paymentType = coreapi.PaymentTypeBankTransfer
	case "permata":
		bankCode = midtrans.BankPermata
		paymentType = coreapi.PaymentTypeBankTransfer
	default:
		bankCode = midtrans.BankBca
		paymentType = coreapi.PaymentTypeBankTransfer
	}

	chargeReq := &coreapi.ChargeReq{
		PaymentType: paymentType,
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: amount,
		},
		BankTransfer: &coreapi.BankTransferDetails{
			Bank: bankCode,
		},
	}

	resp, err := c.core.ChargeTransaction(chargeReq)
	if err != nil {
		return nil, fmt.Errorf("midtrans bank transfer charge error: %w", err)
	}

	result := &BankTransferResult{
		TransactionID:   resp.TransactionID,
		OrderID:         resp.OrderID,
		GrossAmount:     resp.GrossAmount,
		TransactionTime: resp.TransactionTime,
		ExpiryTime:      resp.ExpiryTime,
		PaymentType:     string(resp.PaymentType),
		StatusCode:      resp.StatusCode,
	}

	for _, va := range resp.VaNumbers {
		result.VANumbers = append(result.VANumbers, VANumber{
			Bank:     va.Bank,
			VANumber: va.VANumber,
		})
	}

	return result, nil
}

// GetTransactionStatus queries the transaction status from Midtrans.
func (c *Client) GetTransactionStatus(orderID string) (*coreapi.TransactionStatusResponse, error) {
	resp, err := c.core.CheckTransaction(orderID)
	if err != nil {
		return nil, fmt.Errorf("midtrans check transaction error: %w", err)
	}
	return resp, nil
}

// VerifySignature verifies the Midtrans notification signature key.
// Formula: SHA512(order_id + status_code + gross_amount + server_key)
func (c *Client) VerifySignature(orderID, statusCode, grossAmount, incomingSignature string) bool {
	raw := orderID + statusCode + grossAmount + c.serverKey
	hash := sha512.Sum512([]byte(raw))
	expected := fmt.Sprintf("%x", hash)
	return expected == incomingSignature
}
