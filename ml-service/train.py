"""
CLI training script — run once to produce model.pkl
Usage: python train.py [--dataset /path/to/jm1.csv]
"""
import sys
import argparse
from model import train

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train IntelliSCM defect prediction model")
    parser.add_argument("--dataset", default=None,
                        help="Path to JM1 CSV file (default: ../jm1.csv)")
    args = parser.parse_args()

    print("=" * 55)
    print("  IntelliSCM — ML Defect Prediction Model Trainer")
    print("=" * 55)
    metrics = train(args.dataset)
    print("\n📊 Evaluation Results:")
    print(f"  Accuracy  : {metrics['accuracy']:.4f}")
    print(f"  Precision : {metrics['precision']:.4f}")
    print(f"  Recall    : {metrics['recall']:.4f}")
    print(f"  F1 Score  : {metrics['f1_score']:.4f}")
    print(f"  ROC-AUC   : {metrics['roc_auc']:.4f}")
    print(f"\n🔝 Top Features:")
    for f in metrics["top_features"][:5]:
        print(f"  {f['feature']:<22} {f['importance']:.4f}")
    print("\n✅ Model saved to ml-service/model.pkl")
